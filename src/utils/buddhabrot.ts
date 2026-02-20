import { atomicAdd, Break, float, If, int, Loop, uint } from "three/tsl";
import type { Node, TSL, UniformNode } from "three/webgpu";
import {
  COMPILE_MAX_ITERATIONS,
  HEIGHT,
  MIN_ITERATIONS,
  WIDTH,
} from "../constants";
import type { IntStorageNode } from "./tslCompat";

// =========================================================================
// RANDOM NUMBER GENERATION (Xorshift32 variant)
// =========================================================================
// Because WebGPU shaders do not have a built-in random number generator,
// we implement a fast Xorshift completely in TSL. We generate 3 independent
// uniform variables (r1, r2, r3) between [0.0, 1.0].
// The `seed` uniform is periodically driven by CURBy's quantum randomness,
// providing true entropy rather than just a pseudo-random sequence.
export const randomNumberGenerator = (
  instanceIndex: typeof TSL.instanceIndex,
  seed: UniformNode<"float", number>,
) => {
  // Generate r1 (used for X coordinate of starting point)
  const h1 = instanceIndex.add(uint(seed.mul(1_000_000))).toVar();
  h1.assign(h1.bitXor(h1.shiftLeft(uint(13))));
  h1.assign(h1.bitXor(h1.shiftRight(uint(17))));
  h1.assign(h1.bitXor(h1.shiftLeft(uint(5))));
  h1.assign(h1.mul(uint(1597334677)));
  h1.assign(h1.bitXor(h1.shiftLeft(uint(13))));
  h1.assign(h1.bitXor(h1.shiftRight(uint(17))));
  h1.assign(h1.bitXor(h1.shiftLeft(uint(5))));
  const r1 = float(h1.bitAnd(uint(0x7fffffff))).div(2_147_483_648);

  // Generate r2 (used for Y coordinate of starting point)
  const h2 = instanceIndex
    .add(uint(seed.mul(2_000_000)))
    .add(uint(7919))
    .toVar();
  h2.assign(h2.bitXor(h2.shiftLeft(uint(13))));
  h2.assign(h2.bitXor(h2.shiftRight(uint(17))));
  h2.assign(h2.bitXor(h2.shiftLeft(uint(5))));
  h2.assign(h2.mul(uint(2654435761)));
  h2.assign(h2.bitXor(h2.shiftLeft(uint(13))));
  h2.assign(h2.bitXor(h2.shiftRight(uint(17))));
  h2.assign(h2.bitXor(h2.shiftLeft(uint(5))));
  const r2 = float(h2.bitAnd(uint(0x7fffffff))).div(2_147_483_648);

  // Generate r3 (used for importance sampling probability threshold)
  const h3 = instanceIndex
    .add(uint(seed.mul(3_000_000)))
    .add(uint(104729))
    .toVar();
  h3.assign(h3.bitXor(h3.shiftLeft(uint(13))));
  h3.assign(h3.bitXor(h3.shiftRight(uint(17))));
  h3.assign(h3.bitXor(h3.shiftLeft(uint(5))));
  h3.assign(h3.mul(uint(2246822519)));
  const r3 = float(h3.bitAnd(uint(0x7fffffff))).div(2_147_483_648);

  return { r1, r2, r3 };
};

// =========================================================================
// IMPORTANCE SAMPLING
// =========================================================================
// In a standard fractal, we calculate every pixel independently.
// But a Buddhabrot works by picking random starting points and tracing them everywhere.
// Most random points in the full fractal travel nowhere near the zoomed-in camera view.
// To prevent wasting 99.9% of GPU cycles on invisible points during deep zooms,
// we increase the probability (fraction) of picking random origins 'in or near' our current view.
// We still spawn some global points because a path could start far away
// but fly through our viewport just before escaping!
export const importanceSampler = (
  r1: Node<"float">,
  r2: Node<"float">,
  r3: Node<"float">,
  zoomUniform: UniformNode<"float", number>,
  sampleMinCx: UniformNode<"float", number>,
  sampleMaxCx: UniformNode<"float", number>,
  sampleMinCy: UniformNode<"float", number>,
  sampleMaxCy: UniformNode<"float", number>,
) => {
  const importanceFraction = float(1)
    .sub(float(1).div(zoomUniform))
    .clamp(0, 0.85); // Cap at 85% localized to allow global travelers

  const cx = float(0).toVar();
  const cy = float(0).toVar();

  If(r3.lessThan(importanceFraction), () => {
    // High zoom: pick point within the region heavily influencing the view
    cx.assign(r1.mul(sampleMaxCx.sub(sampleMinCx)).add(sampleMinCx));
    cy.assign(r2.mul(sampleMaxCy.sub(sampleMinCy)).add(sampleMinCy));
  }).Else(() => {
    // Broad zoom: pick point anywhere in generic standard Mandelbrot bounds
    cx.assign(r1.mul(3.5).sub(2.5)); // x in [-2.5, 1.0]
    cy.assign(r2.mul(3).sub(1.5)); // y in [-1.5, 1.5]
  });

  return { cx, cy };
};

export const quickEscapeSampler = (
  maxAllIterUniform: UniformNode<"float", number>,
  cx: Node<"float">,
  cy: Node<"float">,
  redIterUniform: UniformNode<"float", number>,
  greenIterUniform: UniformNode<"float", number>,
  blueIterUniform: UniformNode<"float", number>,
  rotCosXZ: UniformNode<"float", number>,
  rotSinXZ: UniformNode<"float", number>,
  rotCosYW: UniformNode<"float", number>,
  rotSinYW: UniformNode<"float", number>,
  viewCenterX: UniformNode<"float", number>,
  viewCenterY: UniformNode<"float", number>,
  viewHalfH: UniformNode<"float", number>,
  viewHalfW: UniformNode<"float", number>,
  redComputeNode: IntStorageNode,
  greenComputeNode: IntStorageNode,
  blueComputeNode: IntStorageNode,
) => {
  // =========================================================================
  // PASS 1: QUICK ESCAPE & ESCAPE ITERATION DETECTION
  // =========================================================================
  // The core math of the Mandelbrot set: Z_{n+1} = Z_n^2 + C.
  // Unlike a Mandelbrot, which colors points that DON'T escape, the Buddhabrot
  // ONLY draws points that DO escape. So we first test if the point escapes.
  //
  // Optimization (Quick Escape): If a point escapes very early (e.g. < 50 iterations),
  // its 'trail' is boring and noisy. We quickly skip it.
  const zx = float(0).toVar();
  const zy = float(0).toVar();
  const quickEscape = int(0).toVar();

  Loop(MIN_ITERATIONS, () => {
    // Complex arithmetic: (zx + i*zy)^2 + (cx + i*cy)
    const newx = zx.mul(zx).sub(zy.mul(zy)).add(cx).toVar();
    const newy = zx.mul(zy).mul(2).add(cy).toVar();
    zx.assign(newx);
    zy.assign(newy);

    // Escape condition: distance from origin > 2 (magnitude squared > 4)
    If(zx.mul(zx).add(zy.mul(zy)).greaterThan(4), () => {
      quickEscape.assign(1);
      Break();
    });
  });

  // Pass 1 continued: If it survived the MIN_ITERATIONS, we keep computing
  // to see exactly WHEN it escapes (how long it lives).
  If(quickEscape.equal(0), () => {
    const escaped = int(0).toVar();
    const escapeIter = float(MIN_ITERATIONS).toVar();

    Loop(COMPILE_MAX_ITERATIONS - MIN_ITERATIONS, () => {
      If(escapeIter.greaterThanEqual(maxAllIterUniform), () => {
        Break(); // Max iterations hit. It's a "Mandelbrot" point. Skip.
      });
      escapeIter.addAssign(1);

      const newx = zx.mul(zx).sub(zy.mul(zy)).add(cx).toVar();
      const newy = zx.mul(zy).mul(2).add(cy).toVar();
      zx.assign(newx);
      zy.assign(newy);

      If(zx.mul(zx).add(zy.mul(zy)).greaterThan(4), () => {
        escaped.assign(1); // It successfully escaped!
        Break();
      });
    });

    // =========================================================================
    // PASS 2: RETRACE ORBIT & PLOT TO PIXEL BUFFERS (BUDDHABROT METHOD)
    // =========================================================================
    // We now know this random starting point (cx,cy) eventually escapes after
    // `escapeIter` steps.
    // We start back from Z = 0 + 0i and trace its EXACT same path again.
    // For every intermediate step, we map its mathematical coordinate to the screen
    // and increment the pixel brightness at that matching screen coordinate.

    If(escaped.equal(1), () => {
      const { writeR, writeG, writeB } = nebulabrot(
        escapeIter,
        redIterUniform,
        greenIterUniform,
        blueIterUniform,
        zx,
        zy,
      );

      const retraceIter = float(0).toVar();

      Loop(COMPILE_MAX_ITERATIONS, () => {
        If(retraceIter.greaterThanEqual(escapeIter), () => {
          Break();
        });
        retraceIter.addAssign(1);

        // Re-compute Z^2 + C
        const newx = zx.mul(zx).sub(zy.mul(zy)).add(cx).toVar();
        const newy = zx.mul(zy).mul(2).add(cy).toVar();
        zx.assign(newx);
        zy.assign(newy);

        const { ux, uy } = juddhabrot(
          zx,
          zy,
          cx,
          cy,
          rotCosXZ,
          rotSinXZ,
          rotCosYW,
          rotSinYW,
          viewCenterX,
          viewCenterY,
          viewHalfW,
          viewHalfH,
        );

        // If the intermediate point lands inside the camera's viewport
        If(
          ux
            .greaterThanEqual(0)
            .and(ux.lessThan(1))
            .and(uy.greaterThanEqual(0))
            .and(uy.lessThan(1)),
          () => {
            // Flatten 2D (x,y) into a 1D pixel index
            const px = uint(ux.mul(float(WIDTH)));
            const py = uint(uy.mul(float(HEIGHT)));
            const idx = py.mul(uint(WIDTH)).add(px);

            // ATOMIC ADDS: Millions of GPU threads are trying to write to these pixel
            // arrays at the exact same time. `atomicAdd` forces a thread-safe increment
            // so no hits/brightness are lost due to race conditions.
            If(writeR.equal(1), () => {
              atomicAdd(redComputeNode.element(idx), int(1));
            });
            If(writeG.equal(1), () => {
              atomicAdd(greenComputeNode.element(idx), int(1));
            });
            If(writeB.equal(1), () => {
              atomicAdd(blueComputeNode.element(idx), int(1));
            });
          },
        );

        If(zx.mul(zx).add(zy.mul(zy)).greaterThan(4), () => {
          Break();
        });
      });
    });
  });
};

// NEBULABROT TECHNIQUE: The length of the orbit determines its "energy".
// Short orbits are drawn to Red, mid-length to Green, long orbits to Blue.
export const nebulabrot = (
  escapeIter: Node<"float">,
  redIterUniform: UniformNode<"float", number>,
  greenIterUniform: UniformNode<"float", number>,
  blueIterUniform: UniformNode<"float", number>,
  zx: Node<"float">,
  zy: Node<"float">,
) => {
  const writeR = int(0).toVar();
  const writeG = int(0).toVar();
  const writeB = int(0).toVar();
  If(escapeIter.lessThanEqual(redIterUniform), () => {
    writeR.assign(1);
  });
  If(escapeIter.lessThanEqual(greenIterUniform), () => {
    writeG.assign(1);
  });
  If(escapeIter.lessThanEqual(blueIterUniform), () => {
    writeB.assign(1);
  });

  // Reset Z for retracing
  zx.assign(0);
  zy.assign(0);

  return { writeR, writeG, writeB };
};

// =========================================================================
// JUDDHABROT (4D ROTATION)
// =========================================================================
// The equation Z_{n+1} = Z_n^2 + C is inherently 4-Dimensional:
// Zr, Zi (the Z state variable) AND Cr, Ci (the C constant per path).
// A 2D render plots the Zr, Zi plane. The Juddhabrot technique applies an
// n-dimensional rotation matrix between the Z and C axes BEFORE mapping
// them down to the 2D plane (x, y pixels).
const juddhabrot = (
  zx: Node<"float">,
  zy: Node<"float">,
  cx: Node<"float">,
  cy: Node<"float">,
  rotCosXZ: Node<"float">,
  rotSinXZ: Node<"float">,
  rotCosYW: Node<"float">,
  rotSinYW: Node<"float">,
  viewCenterX: Node<"float">,
  viewCenterY: Node<"float">,
  viewHalfW: Node<"float">,
  viewHalfH: Node<"float">,
) => {
  const rzx = zx.mul(rotCosXZ).sub(cx.mul(rotSinXZ));
  const rzy = zy.mul(rotCosYW).sub(cy.mul(rotSinYW));

  // View Transformation: Map complex plane coordinates to normalized 0.0-1.0 screen coordinates.
  // Notice we swap X/Y and negate one. This rotates the mathematical shape 90deg
  // to make the "Buddha" stand upright.
  const fracX = rzy;
  const fracY = rzx.negate();
  const ux = fracX.sub(viewCenterX).div(viewHalfW.mul(2)).add(0.5);
  const uy = fracY.sub(viewCenterY).div(viewHalfH.mul(2)).add(0.5);

  return { ux, uy };
};

import { useMemo, useRef, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import { initCurby, nextSeed, isCurbyReady } from "./curby";
import {
  float,
  vec4,
  instanceIndex,
  uniform,
  Fn,
  uint,
  If,
  uv,
  int,
  log,
  pow,
  max,
  sqrt,
} from "three/tsl";
import {
  WIDTH,
  HEIGHT,
  TOTAL_PIXELS,
  BATCH_SIZE,
  DEFAULT_CENTER_X,
  DEFAULT_CENTER_Y,
  DEFAULT_HALF_W,
  DEFAULT_HALF_H,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_DAMPING,
  COMPUTE_BUDGET_MS,
} from "./constants";
import type { BuddhabrotProps, ViewState, ZoomTarget } from "./types";
import { getViewMetrics, mouseToFractal } from "./utils/view";
import { computeOrbit } from "./utils/orbit";
import { intStorage } from "./utils/tslCompat";
import type { WebGPURendererLike } from "./utils/tslCompat";
import {
  importanceSampler,
  quickEscapeSampler,
  randomNumberGenerator,
} from "./utils/buddhabrot";

export default function Buddhabrot({
  redIter = 50,
  greenIter = 500,
  blueIter = 5000,
  maxIterations = 500,
  nebulaEnabled = false,
  nebulaAesthetic = false,
  rotXZ = 0,
  rotYW = 0,
}: BuddhabrotProps) {
  const { viewport } = useThree();
  const frameCount = useRef(0);
  const needsClearRef = useRef(true);

  // Initialize CURBy beacon on mount
  useEffect(() => {
    initCurby().then(() => {
      if (isCurbyReady()) {
        console.log("[Buddhabrot] Using CURBy beacon for true randomness");
      } else {
        console.warn(
          "[Buddhabrot] CURBy unavailable, using Math.random() fallback",
        );
      }
    });
  }, []);

  const viewRef = useRef<ViewState>({
    centerX: DEFAULT_CENTER_X,
    centerY: DEFAULT_CENTER_Y,
    zoom: 1,
  });
  // Smooth zoom: target that the view lerps toward each frame
  const zoomTarget = useRef<ZoomTarget>({
    centerX: DEFAULT_CENTER_X,
    centerY: DEFAULT_CENTER_Y,
    zoom: 1,
    animating: false,
  });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // --- 3 storage buffers for RGB Nebulabrot channels ---
  const redBuffer = useMemo(
    () => new THREE.StorageBufferAttribute(new Int32Array(TOTAL_PIXELS), 1),
    [],
  );
  const greenBuffer = useMemo(
    () => new THREE.StorageBufferAttribute(new Int32Array(TOTAL_PIXELS), 1),
    [],
  );
  const blueBuffer = useMemo(
    () => new THREE.StorageBufferAttribute(new Int32Array(TOTAL_PIXELS), 1),
    [],
  );

  // Atomic nodes for compute writes
  const redComputeNode = useMemo(
    () => intStorage(redBuffer, "int", TOTAL_PIXELS).toAtomic(),
    [redBuffer],
  );
  const greenComputeNode = useMemo(
    () => intStorage(greenBuffer, "int", TOTAL_PIXELS).toAtomic(),
    [greenBuffer],
  );
  const blueComputeNode = useMemo(
    () => intStorage(blueBuffer, "int", TOTAL_PIXELS).toAtomic(),
    [blueBuffer],
  );

  // Non-atomic nodes for reading (material) and clearing
  const redViewNode = useMemo(
    () => intStorage(redBuffer, "int", TOTAL_PIXELS),
    [redBuffer],
  );
  const greenViewNode = useMemo(
    () => intStorage(greenBuffer, "int", TOTAL_PIXELS),
    [greenBuffer],
  );
  const blueViewNode = useMemo(
    () => intStorage(blueBuffer, "int", TOTAL_PIXELS),
    [blueBuffer],
  );

  const seed = useMemo(() => uniform(0), []);
  const frameCountUniform = useMemo(() => uniform(1), []);
  const zoomUniform = useMemo(() => uniform(1), []);

  // Per-channel iteration limit uniforms
  const redIterUniform = useMemo(() => uniform(float(50)), []);
  const greenIterUniform = useMemo(() => uniform(float(500)), []);
  const blueIterUniform = useMemo(() => uniform(float(5000)), []);
  const maxAllIterUniform = useMemo(() => uniform(float(5000)), []);

  // 4D rotation uniforms (Juddhabrot)
  const rotCosXZ = useMemo(() => uniform(1), []);
  const rotSinXZ = useMemo(() => uniform(0), []);
  const rotCosYW = useMemo(() => uniform(1), []);
  const rotSinYW = useMemo(() => uniform(0), []);

  // Nebula aesthetic mode uniform
  const nebulaAestheticUniform = useMemo(() => uniform(0), []);
  useEffect(() => {
    nebulaAestheticUniform.value = nebulaAesthetic ? 1 : 0;
  }, [nebulaAesthetic, nebulaAestheticUniform]);

  // Sync iteration props → uniforms
  const prevIters = useRef({
    r: redIter,
    g: greenIter,
    b: blueIter,
    max: maxIterations,
    nebula: nebulaEnabled,
    aesthetic: nebulaAesthetic,
  });
  useEffect(() => {
    let effectiveR: number, effectiveG: number, effectiveB: number;
    if (nebulaAesthetic) {
      // Nebula aesthetic: always use per-channel limits for color variation
      effectiveR = redIter;
      effectiveG = greenIter;
      effectiveB = blueIter;
    } else if (nebulaEnabled) {
      // Nebulabrot: per-channel limits capped by maxIterations
      effectiveR = Math.min(redIter, maxIterations);
      effectiveG = Math.min(greenIter, maxIterations);
      effectiveB = Math.min(blueIter, maxIterations);
    } else {
      // Classic mono: all channels use maxIterations
      effectiveR = maxIterations;
      effectiveG = maxIterations;
      effectiveB = maxIterations;
    }
    redIterUniform.value = effectiveR;
    greenIterUniform.value = effectiveG;
    blueIterUniform.value = effectiveB;
    maxAllIterUniform.value = Math.max(effectiveR, effectiveG, effectiveB);
    if (
      prevIters.current.r !== redIter ||
      prevIters.current.g !== greenIter ||
      prevIters.current.b !== blueIter ||
      prevIters.current.max !== maxIterations ||
      prevIters.current.nebula !== nebulaEnabled ||
      prevIters.current.aesthetic !== nebulaAesthetic
    ) {
      prevIters.current = {
        r: redIter,
        g: greenIter,
        b: blueIter,
        max: maxIterations,
        nebula: nebulaEnabled,
        aesthetic: nebulaAesthetic,
      };
      needsClearRef.current = true;
      frameCount.current = 0;
      frameCountUniform.value = 1;
    }
  }, [
    redIter,
    greenIter,
    blueIter,
    maxIterations,
    nebulaEnabled,
    nebulaAesthetic,
    redIterUniform,
    greenIterUniform,
    blueIterUniform,
    maxAllIterUniform,
    frameCountUniform,
  ]);

  // Sync 4D rotation props → uniforms
  const prevRot = useRef({ xz: 0, yw: 0 });
  useEffect(() => {
    rotCosXZ.value = Math.cos(rotXZ);
    rotSinXZ.value = Math.sin(rotXZ);
    rotCosYW.value = Math.cos(rotYW);
    rotSinYW.value = Math.sin(rotYW);
    if (prevRot.current.xz !== rotXZ || prevRot.current.yw !== rotYW) {
      prevRot.current = { xz: rotXZ, yw: rotYW };
      needsClearRef.current = true;
      frameCount.current = 0;
      frameCountUniform.value = 1;
    }
  }, [rotXZ, rotYW, rotCosXZ, rotSinXZ, rotCosYW, rotSinYW, frameCountUniform]);

  // View uniforms
  const viewCenterX = useMemo(() => uniform(DEFAULT_CENTER_X), []);
  const viewCenterY = useMemo(() => uniform(DEFAULT_CENTER_Y), []);
  const viewHalfW = useMemo(() => uniform(DEFAULT_HALF_W), []);
  const viewHalfH = useMemo(() => uniform(DEFAULT_HALF_H), []);

  // Importance sampling region
  const sampleMinCx = useMemo(() => uniform(-2.5), []);
  const sampleMaxCx = useMemo(() => uniform(1), []);
  const sampleMinCy = useMemo(() => uniform(-1.5), []);
  const sampleMaxCy = useMemo(() => uniform(1.5), []);

  // --- Clear all 3 buffers ---
  const clearNode = useMemo(() => {
    return Fn(() => {
      redViewNode.element(instanceIndex).assign(int(0));
      greenViewNode.element(instanceIndex).assign(int(0));
      blueViewNode.element(instanceIndex).assign(int(0));
    })().compute(TOTAL_PIXELS);
  }, [redViewNode, greenViewNode, blueViewNode]);

  // --- Compute: single pass writes to R, G, B channels ---
  const computeNode = useMemo(() => {
    return Fn(() => {
      const { r1, r2, r3 } = randomNumberGenerator(instanceIndex, seed);

      const { cx, cy } = importanceSampler(
        r1,
        r2,
        r3,
        zoomUniform,
        sampleMinCx,
        sampleMaxCx,
        sampleMinCy,
        sampleMaxCy,
      );

      quickEscapeSampler(
        maxAllIterUniform,
        cx,
        cy,
        redIterUniform,
        greenIterUniform,
        blueIterUniform,
        rotCosXZ,
        rotSinXZ,
        rotCosYW,
        rotSinYW,
        viewCenterX,
        viewCenterY,
        viewHalfW,
        viewHalfH,
        redComputeNode,
        greenComputeNode,
        blueComputeNode,
      );
    })().compute(BATCH_SIZE);
  }, [
    redComputeNode,
    greenComputeNode,
    blueComputeNode,
    seed,
    viewCenterX,
    viewCenterY,
    viewHalfW,
    viewHalfH,
    zoomUniform,
    maxAllIterUniform,
    redIterUniform,
    greenIterUniform,
    blueIterUniform,
    sampleMinCx,
    sampleMaxCx,
    sampleMinCy,
    sampleMaxCy,
    rotCosXZ,
    rotSinXZ,
    rotCosYW,
    rotSinYW,
  ]);

  // --- Material: composite RGB from 3 channels ---
  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.colorNode = Fn(() => {
      const vUv = uv();
      const px = uint(vUv.x.mul(float(WIDTH)));
      const py = uint(vUv.y.mul(float(HEIGHT)));
      const index = py.mul(uint(WIDTH)).add(px);

      const countR = float(redViewNode.element(index));
      const countG = float(greenViewNode.element(index));
      const countB = float(blueViewNode.element(index));

      const fc = max(frameCountUniform, 1);
      const normR = countR.div(fc);
      const normG = countG.div(fc);
      const normB = countB.div(fc);

      const r = float(0).toVar();
      const g = float(0).toVar();
      const b = float(0).toVar();

      If(nebulaAestheticUniform.greaterThan(0.5), () => {
        // --- Nebula Aesthetic Mode ---
        // Softer tone curve: sqrt(log) reveals more shadow detail for gaseous look
        const iR = sqrt(log(normR.mul(8).add(1)).div(log(float(50)))).clamp(
          0,
          1,
        );
        const iG = sqrt(log(normG.mul(8).add(1)).div(log(float(50)))).clamp(
          0,
          1,
        );
        const iB = sqrt(log(normB.mul(8).add(1)).div(log(float(50)))).clamp(
          0,
          1,
        );

        // Color matrix: remap channels to nebula palette
        // Short iters (R) → warm amber/red
        // Mid iters (G)   → magenta/purple
        // Long iters (B)  → cyan/blue
        const outR = iR.mul(0.85).add(iG.mul(0.5)).add(iB.mul(0.1));
        const outG = iR.mul(0.2).add(iG.mul(0.1)).add(iB.mul(0.6));
        const outB = iR.mul(0.08).add(iG.mul(0.65)).add(iB.mul(1));

        // Gamma correction (lower = brighter midtones)
        const gR = pow(outR.clamp(0, 1), float(0.75));
        const gG = pow(outG.clamp(0, 1), float(0.75));
        const gB = pow(outB.clamp(0, 1), float(0.75));

        // Soft bloom glow
        const lum = gR.mul(0.2126).add(gG.mul(0.7152)).add(gB.mul(0.0722));
        const glow = pow(lum, float(2)).mul(0.25);

        // Subtle warm shift at bottom, cool at top
        const warmth = float(1).sub(vUv.y).mul(0.1).mul(lum);

        r.assign(gR.add(glow).add(warmth).clamp(0, 1));
        g.assign(gG.add(glow).clamp(0, 1));
        b.assign(gB.add(glow).sub(warmth.mul(0.5)).clamp(0, 1));
      }).Else(() => {
        // --- Classic Mode ---
        const intensityR = log(normR.mul(5).add(1))
          .div(log(float(20)))
          .clamp(0, 1);
        const intensityG = log(normG.mul(5).add(1))
          .div(log(float(20)))
          .clamp(0, 1);
        const intensityB = log(normB.mul(5).add(1))
          .div(log(float(20)))
          .clamp(0, 1);

        const cR = pow(intensityR, float(0.85));
        const cG = pow(intensityG, float(0.85));
        const cB = pow(intensityB, float(0.85));

        const lum = cR.mul(0.2126).add(cG.mul(0.7152)).add(cB.mul(0.0722));
        const glow = pow(lum, float(3)).mul(0.12);

        r.assign(cR.add(glow).clamp(0, 1));
        g.assign(cG.add(glow).clamp(0, 1));
        b.assign(cB.add(glow).clamp(0, 1));
      });

      return vec4(r, g, b, 1);
    })();
    return m;
  }, [
    redViewNode,
    greenViewNode,
    blueViewNode,
    frameCountUniform,
    nebulaAestheticUniform,
  ]);

  // --- Sync view uniforms and trigger clear ---
  const applyView = useCallback(() => {
    const v = viewRef.current;
    const halfW = DEFAULT_HALF_W / v.zoom;
    const halfH = DEFAULT_HALF_H / v.zoom;
    viewCenterX.value = v.centerX;
    viewCenterY.value = v.centerY;
    viewHalfW.value = halfW;
    viewHalfH.value = halfH;
    zoomUniform.value = v.zoom;

    const viewMinX = v.centerX - halfW;
    const viewMaxX = v.centerX + halfW;
    const viewMinY = v.centerY - halfH;
    const viewMaxY = v.centerY + halfH;
    sampleMinCy.value = Math.max(-1.5, viewMinX - halfW);
    sampleMaxCy.value = Math.min(1.5, viewMaxX + halfW);
    sampleMinCx.value = Math.max(-2.5, -(viewMaxY + halfH));
    sampleMaxCx.value = Math.min(1, -(viewMinY - halfH));

    needsClearRef.current = true;
    frameCount.current = 0;
    frameCountUniform.value = 1;
  }, [
    viewCenterX,
    viewCenterY,
    viewHalfW,
    viewHalfH,
    frameCountUniform,
    zoomUniform,
    sampleMinCx,
    sampleMaxCx,
    sampleMinCy,
    sampleMaxCy,
  ]);

  // --- Mouse handlers: zoom, pan, orbit tracing ---
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const t = zoomTarget.current;
      const zoomFactor = e.deltaY > 0 ? 0.85 : 1.18;
      const { fracX, fracY, mx, my } = mouseToFractal(
        e.clientX,
        e.clientY,
        viewRef.current,
        canvas,
      );
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, t.zoom * zoomFactor),
      );
      const newHalfW = DEFAULT_HALF_W / newZoom;
      const newHalfH = DEFAULT_HALF_H / newZoom;
      t.centerX = fracX - (mx - 0.5) * 2 * newHalfW;
      t.centerY = fracY - (my - 0.5) * 2 * newHalfH;
      t.zoom = newZoom;
      t.animating = true;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        dragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        globalThis.__buddhabrotOrbit = null;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (dragging.current) {
        // Pan — apply instantly and keep zoom target in sync
        const v = viewRef.current;
        const t = zoomTarget.current;
        const { meshSize } = getViewMetrics(canvas);
        const dx = (e.clientX - lastMouse.current.x) / meshSize;
        const dy = (e.clientY - lastMouse.current.y) / meshSize;
        const halfW = DEFAULT_HALF_W / v.zoom;
        const halfH = DEFAULT_HALF_H / v.zoom;
        const panX = dx * 2 * halfW;
        const panY = dy * 2 * halfH;
        v.centerX -= panX;
        v.centerY += panY;
        t.centerX -= panX;
        t.centerY += panY;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        applyView();
        globalThis.__buddhabrotOrbit = null;
      } else if (globalThis.__buddhabrotOrbitEnabled) {
        globalThis.__buddhabrotOrbit = computeOrbit(
          e.clientX,
          e.clientY,
          viewRef.current,
          canvas,
          { red: redIter, green: greenIter, blue: blueIter },
          { xz: rotXZ, yw: rotYW },
        );
      } else {
        globalThis.__buddhabrotOrbit = null;
      }
    };

    const onMouseUp = () => {
      dragging.current = false;
    };

    const onMouseLeave = () => {
      globalThis.__buddhabrotOrbit = null;
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    globalThis.addEventListener("mousemove", onMouseMove);
    globalThis.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      globalThis.removeEventListener("mousemove", onMouseMove);
      globalThis.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [gl, applyView, redIter, greenIter, blueIter, rotXZ, rotYW]);

  // Time-budgeted rendering: target ~16ms frames, adapt dispatches
  const lastFrameTime = useRef(8);

  useFrame(({ gl }) => {
    // Smooth zoom animation: lerp current view toward target
    const t = zoomTarget.current;
    const v = viewRef.current;
    if (t.animating) {
      v.zoom += (t.zoom - v.zoom) * ZOOM_DAMPING;
      v.centerX += (t.centerX - v.centerX) * ZOOM_DAMPING;
      v.centerY += (t.centerY - v.centerY) * ZOOM_DAMPING;

      // Settle when close enough to target
      const zoomDiff = Math.abs(v.zoom - t.zoom) / Math.max(t.zoom, 0.001);
      const posDiff =
        Math.abs(v.centerX - t.centerX) + Math.abs(v.centerY - t.centerY);
      if (zoomDiff < 0.001 && posDiff < 0.00001) {
        v.zoom = t.zoom;
        v.centerX = t.centerX;
        v.centerY = t.centerY;
        t.animating = false;
      }
      applyView();
    }

    const gpu = gl as unknown as WebGPURendererLike;
    if (gpu.compute) {
      if (needsClearRef.current) {
        gpu.compute(clearNode);
        needsClearRef.current = false;
      }

      const start = performance.now();
      const passTime = Math.max(lastFrameTime.current, 1);
      const maxPasses = Math.max(1, Math.floor(COMPUTE_BUDGET_MS / passTime));

      let passes = 0;
      for (let i = 0; i < maxPasses; i++) {
        seed.value = nextSeed();
        gpu.compute(computeNode);
        passes++;
      }

      const elapsed = performance.now() - start;
      lastFrameTime.current =
        lastFrameTime.current * 0.7 + (elapsed / Math.max(passes, 1)) * 0.3;

      frameCount.current += passes;
      frameCountUniform.value = frameCount.current;
    }
  });

  const side = Math.min(viewport.width, viewport.height);

  return (
    <mesh scale={[side, side, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

import { useMemo, useState, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import {
  storage,
  float,
  vec2,
  vec3,
  vec4,
  instanceIndex,
  uniform,
  Fn,
  uint,
  Loop,
  atomicAdd,
  If,
  uv,
  int,
  Break,
  time,
  sin,
  sqrt,
  add,
} from "three/tsl";

const WIDTH = 1024;
const HEIGHT = 1024;
const TOTAL_PIXELS = WIDTH * HEIGHT;
const MAX_ITERATIONS = 200;
const BATCH_SIZE = 262144;

export default function Buddhabrot() {
  const { viewport } = useThree();
  const frameCount = useRef(0);

  const storageBuffer = useMemo(() => {
    return new THREE.StorageBufferAttribute(new Int32Array(TOTAL_PIXELS), 1);
  }, []);

  const computeBufferNode = useMemo(
    () => storage(storageBuffer, "int", TOTAL_PIXELS).toAtomic(),
    [storageBuffer],
  );
  const viewBufferNode = useMemo(
    () => storage(storageBuffer, "int", TOTAL_PIXELS),
    [storageBuffer],
  );

  const seed = useMemo(() => uniform(0.0), []);
  const frameCountUniform = useMemo(() => uniform(1.0), []);
  const [needsClear, setNeedsClear] = useState(true);

  const clearNode = useMemo(() => {
    return Fn(() => {
      viewBufferNode.element(instanceIndex).assign(int(0));
    })().compute(TOTAL_PIXELS);
  }, [viewBufferNode]);

  const computeNode = useMemo(() => {
    return Fn(() => {
      // --- Inline hash: 3-step LCG for random number generation ---
      // Random 1
      const h1 = instanceIndex.add(uint(seed.mul(1000000.0))).toVar();
      h1.assign(h1.mul(uint(1103515245)).add(uint(12345)));
      h1.assign(h1.mul(uint(1103515245)).add(uint(12345)));
      h1.assign(h1.mul(uint(1103515245)).add(uint(12345)));
      const r1 = float(h1.bitAnd(uint(0x7fffffff))).div(2147483648.0);

      // Random 2
      const h2 = instanceIndex
        .add(uint(seed.mul(2000000.0)))
        .add(uint(789))
        .toVar();
      h2.assign(h2.mul(uint(1103515245)).add(uint(12345)));
      h2.assign(h2.mul(uint(1103515245)).add(uint(12345)));
      h2.assign(h2.mul(uint(1103515245)).add(uint(12345)));
      const r2 = float(h2.bitAnd(uint(0x7fffffff))).div(2147483648.0);

      // Sample c in the Mandelbrot region
      const cx = r1.mul(4.0).sub(2.5); // [-2.5, 1.5]
      const cy = r2.mul(4.0).sub(2.0); // [-2.0, 2.0]

      // --- Pass 1: Check if orbit escapes ---
      const zx = float(0.0).toVar();
      const zy = float(0.0).toVar();
      const escaped = int(0).toVar();

      Loop(MAX_ITERATIONS, () => {
        // .toVar() forces TSL to emit declarations before the assigns,
        // preventing the aliasing bug where zy's update would use new zx
        const newx = zx.mul(zx).sub(zy.mul(zy)).add(cx).toVar();
        const newy = zx.mul(zy).mul(2.0).add(cy).toVar();
        zx.assign(newx);
        zy.assign(newy);

        If(zx.mul(zx).add(zy.mul(zy)).greaterThan(4.0), () => {
          escaped.assign(1);
          Break();
        });
      });

      // --- Pass 2: Re-trace and record the orbit ---
      If(escaped.equal(1), () => {
        zx.assign(0.0);
        zy.assign(0.0);

        Loop(MAX_ITERATIONS, () => {
          const newx = zx.mul(zx).sub(zy.mul(zy)).add(cx).toVar();
          const newy = zx.mul(zy).mul(2.0).add(cy).toVar();
          zx.assign(newx);
          zy.assign(newy);

          // Map orbit point to pixel coordinates
          // Viewing window: x in [-2.5, 1.5], y in [-2.0, 2.0]
          const ux = zx.add(2.5).div(4.0);
          const uy = zy.add(2.0).div(4.0);

          If(
            ux
              .greaterThanEqual(0.0)
              .and(ux.lessThan(1.0))
              .and(uy.greaterThanEqual(0.0))
              .and(uy.lessThan(1.0)),
            () => {
              const px = uint(ux.mul(float(WIDTH)));
              const py = uint(uy.mul(float(HEIGHT)));
              const idx = py.mul(uint(WIDTH)).add(px);
              atomicAdd(computeBufferNode.element(idx), int(1));
            },
          );

          If(zx.mul(zx).add(zy.mul(zy)).greaterThan(4.0), () => {
            Break();
          });
        });
      });
    })().compute(BATCH_SIZE);
  }, [computeBufferNode, seed]);

  const material = useMemo(() => {
    const m = new THREE.MeshBasicNodeMaterial();
    m.colorNode = Fn(() => {
      const vUv = uv();
      const px = uint(vUv.x.mul(float(WIDTH)));
      const py = uint(vUv.y.mul(float(HEIGHT)));
      const index = py.mul(uint(WIDTH)).add(px);

      const count = float(viewBufferNode.element(index));

      // Adaptive exposure: normalize by frame count
      const normalized = count.div(frameCountUniform.mul(2.0));
      const intensity = sqrt(normalized).clamp(0.0, 1.0);

      const cosmicBlue = vec3(0.3, 0.6, 1.0);
      const bgPulse = sin(time.mul(0.5)).smoothstep(-1.0, 1.0).mul(0.02);
      const bg = vec3(0.005, 0.005, add(0.02, bgPulse));

      return vec4(intensity.mul(cosmicBlue).add(bg), 1.0);
    })();
    return m;
  }, [viewBufferNode]);

  useFrame(({ gl }) => {
    if ((gl as any).compute) {
      if (needsClear) {
        (gl as any).compute(clearNode);
        setNeedsClear(false);
      }
      seed.value = Math.random();
      (gl as any).compute(computeNode);
      frameCount.current++;
      frameCountUniform.value = frameCount.current;
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

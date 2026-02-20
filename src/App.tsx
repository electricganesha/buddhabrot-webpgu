import { useState, useEffect, useRef, useCallback } from "react";
import { createRoot, events, extend } from "@react-three/fiber";
import type { Catalogue, ReconcilerRoot } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import Buddhabrot from "./Buddhabrot";
import type { WebGPURendererHandle } from "./types";
import { createWebGPURenderer, cleanupRenderer } from "./utils/renderer";
import { drawOrbitFrame } from "./utils/orbitOverlay";
import ControlPanel from "./components/ControlPanel";
import AboutDialog from "./components/AboutDialog";
import "./App.css";

// THREE contains non-constructor namespace members that conflict with R3F's
// Catalogue type — cast to satisfy the overload.
extend(THREE as unknown as Catalogue);

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const orbitCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gpuError, setGpuError] = useState<string | null>(null);

  const [redIter, setRedIter] = useState(50);
  const [greenIter, setGreenIter] = useState(500);
  const [blueIter, setBlueIter] = useState(5000);
  const [maxIterations, setMaxIterations] = useState(500);
  const itersRef = useRef({ r: 50, g: 500, b: 5000, max: 500 });
  const orbitEnabledRef = useRef(false);
  const [nebulaEnabled, setNebulaEnabled] = useState(false);
  const nebulaEnabledRef = useRef(false);
  const [nebulaAestheticEnabled, setNebulaAestheticEnabled] = useState(false);
  const nebulaAestheticEnabledRef = useRef(false);
  const [colorCoreEnabled, setColorCoreEnabled] = useState(false);
  const colorCoreEnabledRef = useRef(false);
  const [coreColorHex, setCoreColorHex] = useState("#ffd700");
  const coreColorHexRef = useRef("#ffd700");
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateRef = useRef(false);
  const [rotXZ, setRotXZ] = useState(0);
  const [rotYW, setRotYW] = useState(0);
  const rotRef = useRef({ xz: 0, yw: 0 });
  const [orbitEnabled, setOrbitEnabled] = useState(false);

  // --- WebGPU renderer lifecycle ---
  useEffect(() => {
    if (!navigator.gpu) {
      queueMicrotask(() =>
        setGpuError("WebGPU is not supported by your browser."),
      );
      return;
    }

    const mount = mountRef.current;
    if (!mount) return;

    let root: ReconcilerRoot<HTMLCanvasElement> | null = null;
    let renderer: WebGPURendererHandle | null = null;
    let cancelled = false;
    let handleResize: (() => void) | null = null;

    const start = async () => {
      const result = await createWebGPURenderer();

      if (cancelled) {
        cleanupRenderer(result.renderer, null);
        return;
      }

      renderer = result.renderer;
      mount.appendChild(result.canvas);
      root = createRoot(result.canvas);

      root.configure({
        gl: renderer as unknown as THREE.WebGPURenderer,
        events,
        size: {
          width: globalThis.innerWidth,
          height: globalThis.innerHeight,
          top: 0,
          left: 0,
        },
        dpr: [1, 2],
      });

      const updateRender = () => {
        if (root) {
          const { r, g, b, max } = itersRef.current;
          root.render(
            <Buddhabrot
              redIter={r}
              greenIter={g}
              blueIter={b}
              maxIterations={max}
              nebulaEnabled={nebulaEnabledRef.current}
              nebulaAesthetic={nebulaAestheticEnabledRef.current}
              colorCoreEnabled={colorCoreEnabledRef.current}
              coreColorHex={coreColorHexRef.current}
              rotXZ={rotRef.current.xz}
              rotYW={rotRef.current.yw}
            />,
          );
        }
      };
      globalThis.__buddhabrotUpdate = updateRender;
      updateRender();

      handleResize = () => {
        root?.configure({
          size: {
            width: globalThis.innerWidth,
            height: globalThis.innerHeight,
            top: 0,
            left: 0,
          },
        });
      };
      globalThis.addEventListener("resize", handleResize);
    };

    start();

    return () => {
      cancelled = true;
      if (handleResize) globalThis.removeEventListener("resize", handleResize);
      globalThis.__buddhabrotUpdate = undefined;
      globalThis.__buddhabrotOrbit = undefined;
      if (root) root.unmount();
      cleanupRenderer(renderer, mount);
    };
  }, []);

  // --- Orbit overlay drawing loop ---
  useEffect(() => {
    const canvas = orbitCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const tick = () => {
      animId = requestAnimationFrame(tick);
      drawOrbitFrame(ctx, canvas, orbitEnabledRef.current);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // --- Callbacks ---
  const updateIter = useCallback(
    (channel: "r" | "g" | "b" | "max", value: number) => {
      itersRef.current[channel] = value;
      if (channel === "r") setRedIter(value);
      if (channel === "g") setGreenIter(value);
      if (channel === "b") setBlueIter(value);
      if (channel === "max") setMaxIterations(value);
      globalThis.__buddhabrotUpdate?.();
    },
    [],
  );

  const updateRot = useCallback((plane: "xz" | "yw", value: number) => {
    rotRef.current[plane] = value;
    if (plane === "xz") setRotXZ(value);
    if (plane === "yw") setRotYW(value);
    globalThis.__buddhabrotUpdate?.();
  }, []);

  // --- Auto-rotation animation loop ---
  useEffect(() => {
    if (!autoRotateRef.current) return;
    let animId: number;
    let lastTime = performance.now();
    const speed = 0.3;
    const tick = (now: number) => {
      if (!autoRotateRef.current) return;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      const next = rotRef.current.yw + speed * dt;
      const wrapped =
        ((((next + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
        Math.PI;
      rotRef.current.yw = wrapped;
      setRotYW(wrapped);
      globalThis.__buddhabrotUpdate?.();
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate]);

  // --- Toggle handlers ---
  const handleNebulaChange = useCallback((enabled: boolean) => {
    setNebulaEnabled(enabled);
    nebulaEnabledRef.current = enabled;
    globalThis.__buddhabrotUpdate?.();
  }, []);

  const handleAestheticChange = useCallback((enabled: boolean) => {
    setNebulaAestheticEnabled(enabled);
    nebulaAestheticEnabledRef.current = enabled;
    globalThis.__buddhabrotUpdate?.();
  }, []);

  const handleColorCoreChange = useCallback((enabled: boolean) => {
    setColorCoreEnabled(enabled);
    colorCoreEnabledRef.current = enabled;
    globalThis.__buddhabrotUpdate?.();
  }, []);

  const handleCoreColorChange = useCallback((hex: string) => {
    setCoreColorHex(hex);
    coreColorHexRef.current = hex;
    globalThis.__buddhabrotUpdate?.();
  }, []);

  const handleRotationChange = useCallback(
    (enabled: boolean) => {
      setRotationEnabled(enabled);
      if (!enabled) {
        setAutoRotate(false);
        autoRotateRef.current = false;
        updateRot("xz", 0);
        updateRot("yw", 0);
      }
    },
    [updateRot],
  );

  const handleAutoRotateChange = useCallback((enabled: boolean) => {
    setAutoRotate(enabled);
    autoRotateRef.current = enabled;
  }, []);

  const handleOrbitChange = useCallback((enabled: boolean) => {
    setOrbitEnabled(enabled);
    orbitEnabledRef.current = enabled;
    globalThis.__buddhabrotOrbitEnabled = enabled;
    if (!enabled) {
      globalThis.__buddhabrotOrbit = null;
    }
  }, []);

  // --- Render ---
  if (gpuError) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#050510",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>WebGPU Not Available</h2>
          <p>{gpuError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#000",
        position: "relative",
      }}
    >
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />

      <canvas
        ref={orbitCanvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      <AboutDialog />

      <ControlPanel
        redIter={redIter}
        greenIter={greenIter}
        blueIter={blueIter}
        maxIterations={maxIterations}
        nebulaEnabled={nebulaEnabled}
        nebulaAestheticEnabled={nebulaAestheticEnabled}
        colorCoreEnabled={colorCoreEnabled}
        coreColorHex={coreColorHex}
        rotationEnabled={rotationEnabled}
        autoRotate={autoRotate}
        rotXZ={rotXZ}
        rotYW={rotYW}
        orbitEnabled={orbitEnabled}
        onUpdateIter={updateIter}
        onUpdateRot={updateRot}
        onNebulaChange={handleNebulaChange}
        onAestheticChange={handleAestheticChange}
        onColorCoreChange={handleColorCoreChange}
        onCoreColorChange={handleCoreColorChange}
        onRotationChange={handleRotationChange}
        onAutoRotateChange={handleAutoRotateChange}
        onOrbitChange={handleOrbitChange}
      />
    </div>
  );
}

export default App;

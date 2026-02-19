import { useState, useEffect, useRef } from "react";
import { createRoot, events, extend } from "@react-three/fiber";
import * as THREE from "three/webgpu";
import Buddhabrot from "./Buddhabrot";
import "./App.css";

extend(THREE);

function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [gpuError, setGpuError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.gpu) {
      setGpuError("WebGPU is not supported by your browser.");
      return;
    }

    if (!mountRef.current) return;

    let root: any = null;
    let renderer: any = null;
    let cancelled = false;
    let handleResize: (() => void) | null = null;

    const start = async () => {
      const canvas = document.createElement("canvas");
      canvas.style.display = "block";
      canvas.style.width = "100%";
      canvas.style.height = "100%";

      const gpuRenderer = new THREE.WebGPURenderer({
        canvas,
        antialias: false,
      });
      await gpuRenderer.init();

      // StrictMode may have unmounted before init() finished
      if (cancelled) {
        gpuRenderer.dispose();
        return;
      }

      mountRef.current?.appendChild(canvas);

      renderer = gpuRenderer;
      root = createRoot(canvas);

      root.configure({
        gl: renderer,
        events,
        size: {
          width: window.innerWidth,
          height: window.innerHeight,
          top: 0,
          left: 0,
        },
        dpr: [1, 2],
      });

      root.render(<Buddhabrot />);

      handleResize = () => {
        if (root) {
          root.configure({
            size: {
              width: window.innerWidth,
              height: window.innerHeight,
              top: 0,
              left: 0,
            },
          });
        }
      };
      window.addEventListener("resize", handleResize);
    };

    start();

    return () => {
      cancelled = true;
      if (handleResize) window.removeEventListener("resize", handleResize);
      if (root) root.unmount();
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
      }
      // Remove any canvases we added
      if (mountRef.current) {
        mountRef.current
          .querySelectorAll("canvas")
          .forEach((c: Element) => c.remove());
      }
    };
  }, []);

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
      ref={mountRef}
      style={{ width: "100vw", height: "100vh", background: "#000" }}
    />
  );
}

export default App;

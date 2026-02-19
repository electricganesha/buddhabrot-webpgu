/**
 * WebGPU renderer initialisation helpers.
 *
 * Extracted from App.tsx so the component only deals with React state.
 */

import * as THREE from "three/webgpu";
import type { WebGPURendererHandle } from "../types";

/** Result returned by {@link createWebGPURenderer}. */
export interface RendererResult {
  canvas: HTMLCanvasElement;
  renderer: WebGPURendererHandle;
}

/**
 * Create a WebGPU-backed canvas and renderer, then wait for GPU init.
 *
 * The canvas is styled to fill its container but is **not** appended to the
 * DOM — the caller decides where to mount it.
 */
export async function createWebGPURenderer(): Promise<RendererResult> {
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";

  const gpuRenderer = new THREE.WebGPURenderer({ canvas, antialias: false });
  await gpuRenderer.init();

  return {
    canvas,
    renderer: gpuRenderer as unknown as WebGPURendererHandle,
  };
}

/** Tear down the renderer and remove all canvases from a mount element. */
export function cleanupRenderer(
  renderer: WebGPURendererHandle | null,
  mount: HTMLElement | null,
) {
  if (renderer) {
    renderer.setAnimationLoop(null);
    renderer.dispose();
  }
  if (mount) {
    mount.querySelectorAll("canvas").forEach((c: Element) => c.remove());
  }
}

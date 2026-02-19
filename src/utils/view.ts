import { DEFAULT_HALF_W, DEFAULT_HALF_H } from "../constants";
import type { ViewState, ViewMetrics, FractalCoords } from "../types";

/** Compute the rendered mesh metrics (size and left offset) from a canvas. */
export function getViewMetrics(canvas: HTMLCanvasElement): ViewMetrics {
  const rect = canvas.getBoundingClientRect();
  const meshSize = rect.height;
  const meshLeft = (rect.width - meshSize) / 2;
  return { rect, meshSize, meshLeft };
}

/**
 * Convert a screen-space mouse position to fractal coordinates
 * within the current view.
 */
export function mouseToFractal(
  clientX: number,
  clientY: number,
  view: ViewState,
  canvas: HTMLCanvasElement,
): FractalCoords {
  const { rect, meshSize, meshLeft } = getViewMetrics(canvas);
  const mx = (clientX - rect.left - meshLeft) / meshSize;
  const my = 1 - (clientY - rect.top) / meshSize;
  const halfW = DEFAULT_HALF_W / view.zoom;
  const halfH = DEFAULT_HALF_H / view.zoom;
  return {
    fracX: view.centerX + (mx - 0.5) * 2 * halfW,
    fracY: view.centerY + (my - 0.5) * 2 * halfH,
    mx,
    my,
  };
}

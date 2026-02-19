import { DEFAULT_HALF_W, DEFAULT_HALF_H } from "../constants";
import type { BuddhabrotOrbit, ViewState } from "../types";

/**
 * Compute the orbit for a given c-value and produce screen-space points.
 * Returns null if the mouse is outside the mesh bounds.
 */
export function computeOrbit(
  clientX: number,
  clientY: number,
  view: ViewState,
  canvas: HTMLCanvasElement,
  iters: { red: number; green: number; blue: number },
  rotation: { xz: number; yw: number },
): BuddhabrotOrbit | null {
  const rect = canvas.getBoundingClientRect();
  const meshSize = rect.height;
  const meshLeft = (rect.width - meshSize) / 2;

  const mx = (clientX - rect.left - meshLeft) / meshSize;
  const my = 1 - (clientY - rect.top) / meshSize;

  if (mx < 0 || mx > 1 || my < 0 || my > 1) return null;

  const halfW = DEFAULT_HALF_W / view.zoom;
  const halfH = DEFAULT_HALF_H / view.zoom;
  const fracX = view.centerX + (mx - 0.5) * 2 * halfW;
  const fracY = view.centerY + (my - 0.5) * 2 * halfH;

  // In rotated frame: fracX = imaginary, fracY = -real
  const ccx = -fracY;
  const ccy = fracX;

  let zx = 0;
  let zy = 0;
  const maxIter = Math.max(iters.red, iters.green, iters.blue);
  const displayLimit = Math.min(maxIter, 2000);
  const points: { x: number; y: number }[] = [];
  let escaped = false;

  const cosXZ = Math.cos(rotation.xz);
  const sinXZ = Math.sin(rotation.xz);
  const cosYW = Math.cos(rotation.yw);
  const sinYW = Math.sin(rotation.yw);

  for (let i = 0; i < displayLimit; i++) {
    const newx = zx * zx - zy * zy + ccx;
    const newy = 2 * zx * zy + ccy;
    zx = newx;
    zy = newy;

    // Apply 4D rotation (Juddhabrot)
    const rzxVal = zx * cosXZ - ccx * sinXZ;
    const rzyVal = zy * cosYW - ccy * sinYW;

    // Map rotated orbit point back to screen
    const ofx = rzyVal;
    const ofy = -rzxVal;
    const ux = (ofx - view.centerX) / (2 * halfW) + 0.5;
    const uy = (ofy - view.centerY) / (2 * halfH) + 0.5;
    const sx = meshLeft + ux * meshSize;
    const sy = (1 - uy) * meshSize;
    points.push({ x: sx, y: sy });

    if (zx * zx + zy * zy > 4) {
      escaped = true;
      break;
    }
  }

  return {
    points,
    escaped,
    escapeIter: points.length,
    cx: ccx,
    cy: ccy,
    redIter: iters.red,
    greenIter: iters.green,
    blueIter: iters.blue,
  };
}

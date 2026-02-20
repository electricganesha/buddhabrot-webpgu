import type { BuddhabrotOrbit } from "../types";

/** Pick an RGB colour based on which iteration-count channel `i` belongs to. */
export function channelColor(
  i: number,
  rI: number,
  gI: number,
): [number, number, number] {
  if (i <= rI) return [255, 70, 50];
  if (i <= gI) return [50, 255, 70];
  return [70, 120, 255];
}

/** Draw the orbit path segments (glow + core passes). */
export function drawOrbitPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  rI: number,
  gI: number,
) {
  for (let i = 1; i < points.length; i++) {
    const [r, g, b] = channelColor(i, rI, gI);
    const alpha = 0.15 + 0.55 * (1 - i / points.length);

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.3})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
}

/** Draw dots at orbit points (subsampled for long orbits). */
export function drawOrbitDots(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  rI: number,
  gI: number,
) {
  const step = Math.max(1, Math.floor(points.length / 200));
  for (let i = 0; i < points.length; i += step) {
    const [r, g, b] = channelColor(i + 1, rI, gI);
    const alpha = 0.3 + 0.7 * (1 - i / points.length);
    const size = 1 + (1 - i / points.length) * 2;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(points[i].x, points[i].y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw the info label showing the c-value and escape status. */
function drawInfoLabel(
  ctx: CanvasRenderingContext2D,
  orbit: BuddhabrotOrbit,
  canvasHeight: number,
) {
  const { escaped, escapeIter, cx, cy } = orbit;
  const sign = cy >= 0 ? "+" : "-";
  const label = escaped
    ? `c = ${cx.toFixed(4)} ${sign} ${Math.abs(cy).toFixed(4)}i  ·  escaped at ${escapeIter}`
    : `c = ${cx.toFixed(4)} ${sign} ${Math.abs(cy).toFixed(4)}i  ·  bounded`;

  ctx.font = "11px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.fillText(label, 12, canvasHeight - 12);
}

/** Resize a canvas to match its parent's display size (if needed). */
export function syncCanvasSize(canvas: HTMLCanvasElement) {
  const parent = canvas.parentElement;
  if (parent) {
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }
}

/**
 * Render one frame of the orbit overlay.
 *
 * Handles canvas resizing, early-out when disabled, path/dot drawing,
 * and the info label.
 */
export function drawOrbitFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  orbitEnabled: boolean,
) {
  syncCanvasSize(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!orbitEnabled) return;

  const orbit = globalThis.__buddhabrotOrbit;
  if (!orbit?.points || orbit.points.length < 2) return;

  const { points, redIter: rI, greenIter: gI } = orbit;

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.scale(dpr, dpr);

  drawOrbitPath(ctx, points, rI, gI);
  drawOrbitDots(ctx, points, rI, gI);
  drawInfoLabel(
    ctx,
    orbit,
    canvas.parentElement?.clientHeight ?? canvas.height / dpr,
  );

  ctx.restore();
}

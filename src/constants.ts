/** Render target dimensions. */
export const WIDTH = 1024;
export const HEIGHT = 1024;
export const TOTAL_PIXELS = WIDTH * HEIGHT;

/** GPU compute shader limits. */
export const COMPILE_MAX_ITERATIONS = 2000;
export const MIN_ITERATIONS = 20;
export const BATCH_SIZE = 131072;

/** Default view: the full Buddhabrot (rotated so head is up). */
export const DEFAULT_CENTER_X = 0;
export const DEFAULT_CENTER_Y = 0;
export const DEFAULT_HALF_W = 1.5;
export const DEFAULT_HALF_H = 1.75;

/**
 * Zoom limits: beyond ~5k×, float32 precision on the GPU and orbit point
 * density both degrade, producing a black image.
 */
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 5000;

/** Smooth zoom animation damping factor (0–1, lower = smoother). */
export const ZOOM_DAMPING = 0.15;

/** Time-budget rendering target (ms) to leave headroom for display. */
export const COMPUTE_BUDGET_MS = 12;

/** Logarithmic slider mapping: position [0,1] → iterations [ITER_MIN, ITER_MAX]. */
export const ITER_MIN = 5;
export const ITER_MAX = 50000;

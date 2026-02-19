/** Orbit data computed for a single c-value, shared via window global. */
export interface BuddhabrotOrbit {
  points: { x: number; y: number }[];
  escaped: boolean;
  escapeIter: number;
  cx: number;
  cy: number;
  redIter: number;
  greenIter: number;
  blueIter: number;
}

/** Props for the Buddhabrot renderer component. */
export interface BuddhabrotProps {
  readonly redIter?: number;
  readonly greenIter?: number;
  readonly blueIter?: number;
  readonly maxIterations?: number;
  readonly nebulaEnabled?: boolean;
  readonly nebulaAesthetic?: boolean;
  readonly rotXZ?: number;
  readonly rotYW?: number;
}

/** 2D point. */
export interface Point2D {
  readonly x: number;
  readonly y: number;
}

/** View state for pan/zoom. */
export interface ViewState {
  centerX: number;
  centerY: number;
  zoom: number;
}

/** Zoom animation target. */
export interface ZoomTarget extends ViewState {
  animating: boolean;
}

/** Metrics describing the rendered mesh position on screen. */
export interface ViewMetrics {
  readonly rect: DOMRect;
  readonly meshSize: number;
  readonly meshLeft: number;
}

/** Result of mapping a screen position to fractal coordinates. */
export interface FractalCoords {
  readonly fracX: number;
  readonly fracY: number;
  readonly mx: number;
  readonly my: number;
}

/**
 * Augment the global scope so `globalThis.__buddhabrot*` properties
 * are properly typed throughout the project.
 */
declare global {
  var __buddhabrotOrbit: BuddhabrotOrbit | null | undefined;
  var __buddhabrotOrbitEnabled: boolean | undefined;
  var __buddhabrotUpdate: (() => void) | undefined;
}

/**
 * Minimal interface for the WebGPU renderer from `three/webgpu`.
 * The module ships without TypeScript declarations, so we type
 * only the surface we actually use.
 */
export interface WebGPURendererHandle {
  readonly domElement: HTMLCanvasElement;
  init(): Promise<unknown>;
  dispose(): void;
  setAnimationLoop(callback: (() => void) | null): void;
}

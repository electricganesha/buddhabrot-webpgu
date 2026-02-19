/**
 * Compatibility wrappers for three.js TSL types.
 *
 * `@types/three` omits the "int" overload for the TSL `storage()` helper and
 * its intersection types collapse to `never` for atomic buffers.  These
 * minimal interfaces type only the surface we actually use.
 */

import { storage } from "three/tsl";
import type * as THREE from "three/webgpu";
// Import the TSL Node type for use in storage node interfaces.
import type NodeType from "three/src/nodes/core/Node.js";

/** A storage buffer node backed by 32-bit integers. */
export interface IntStorageNode {
  element(index: NodeType | number): NodeType;
  toAtomic(): IntStorageNode;
}

/**
 * Cast of the TSL `storage()` helper that accepts `"int"` as the type
 * parameter — missing from the published type definitions.
 */
export const intStorage = storage as unknown as (
  buffer: THREE.StorageBufferAttribute,
  type: "int",
  count: number,
) => IntStorageNode;

/**
 * R3F types `state.gl` as `WebGLRenderer`, but we configure it with a
 * `WebGPURenderer` that exposes a `compute()` method.
 */
export interface WebGPURendererLike {
  compute(node: unknown): void;
}

import { BitReader } from "@buff-beacon-project/rand-utils";

const CURBY_API = "https://random.colorado.edu/api";
// How often to fetch a new pulse (ms). Classical beacon emits every ~60s.
const REFRESH_INTERVAL = 60_000;

interface CurbyState {
  seeds: number[];
  index: number;
  lastFetch: number;
  chainCid: string | null;
  fetching: boolean;
  ready: boolean;
}

const state: CurbyState = {
  seeds: [],
  index: 0,
  lastFetch: 0,
  chainCid: null,
  fetching: false,
  ready: false,
};

/**
 * Discover the CURBy-RNG chain CID from the API.
 */
async function discoverChainCid(): Promise<string | null> {
  try {
    const res = await fetch(`${CURBY_API}/chains/`);
    if (!res.ok) return null;
    const chains: {
      cid: { "/": string };
      data: { content: { meta?: { name?: string } } };
    }[] = await res.json();
    const rng = chains.find((c) => c.data?.content?.meta?.name === "CURBy-RNG");
    return rng?.cid["/"] ?? null;
  } catch {
    console.warn("[CURBy] Failed to discover chain CID");
    return null;
  }
}

/**
 * Decode a DAG-JSON bytes value ({ "/": { "bytes": "<base64>" } }) into a Uint8Array.
 */
function decodeDagJsonBytes(obj: { "/": { bytes: string } }): Uint8Array {
  const b64 = obj["/"].bytes;
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    arr[i] = bin.codePointAt(i)!;
  }
  return arr;
}

/**
 * Fetch the latest pulse from the CURBy-RNG chain and extract seeds.
 */
async function fetchPulse(): Promise<number[]> {
  if (!state.chainCid) {
    state.chainCid = await discoverChainCid();
    if (!state.chainCid) {
      throw new Error("Could not find CURBy-RNG chain");
    }
  }

  const res = await fetch(
    `${CURBY_API}/chains/${state.chainCid}/pulses/latest`,
  );
  if (!res.ok) {
    throw new Error(`CURBy API error: ${res.status}`);
  }

  const pulse = await res.json();
  const payload = pulse.data?.content?.payload;
  if (!payload?.salt) {
    throw new Error("No salt in CURBy pulse payload");
  }

  // Extract the salt bytes — this is the core randomness from the beacon
  const saltBytes = decodeDagJsonBytes(payload.salt);

  // Use BitReader from rand-utils to read the random bits
  const reader = BitReader.from(saltBytes);
  const stream = reader.stream();

  // Extract 32-bit seeds as floats in [0, 1)
  // Each seed is 32 bits = 4 bytes. Salt is typically 64 bytes = 16 seeds.
  // We'll also hash-expand: XOR salt with the pulse pre-commitment for more bits.
  const seeds: number[] = [];
  try {
    while (true) {
      const bits = stream.readBits(32, false);
      // Convert to [0, 1) float
      seeds.push((bits >>> 0) / 0x100000000);
    }
  } catch {
    // BitStream exhausted — expected
  }

  // Also extract from the pre-commitment hash for additional entropy
  if (payload.pre) {
    try {
      const preBytes = decodeDagJsonBytes(payload.pre);
      const preReader = BitReader.from(preBytes);
      const preStream = preReader.stream();
      try {
        while (true) {
          const bits = preStream.readBits(32, false);
          seeds.push((bits >>> 0) / 0x100000000);
        }
      } catch {
        // exhausted
      }
    } catch {
      // pre field might not be decodable, that's ok
    }
  }

  console.log(`[CURBy] Extracted ${seeds.length} seeds from beacon pulse`);
  return seeds;
}

/**
 * Refresh the seed pool from the CURBy beacon.
 * Non-blocking: runs in background and updates state when done.
 */
async function refreshPool(): Promise<void> {
  if (state.fetching) return;
  state.fetching = true;
  try {
    const seeds = await fetchPulse();
    if (seeds.length > 0) {
      state.seeds = seeds;
      state.index = 0;
      state.lastFetch = Date.now();
      state.ready = true;
    }
  } catch (err) {
    console.warn("[CURBy] Failed to fetch beacon pulse, using fallback:", err);
  } finally {
    state.fetching = false;
  }
}

/**
 * Initialize the CURBy randomness source.
 * Call once at startup. Returns a promise that resolves when the first
 * pulse is fetched (or fails gracefully).
 */
export async function initCurby(): Promise<void> {
  await refreshPool();
}

/**
 * Get the next seed value from the CURBy beacon pool.
 * Falls back to Math.random() if beacon data is unavailable.
 *
 * When the pool is exhausted, seeds are mixed with a frame counter
 * using a hash to produce new unique values while preserving the
 * beacon's entropy as the source.
 */
export function nextSeed(): number {
  // Trigger background refresh if stale
  if (Date.now() - state.lastFetch > REFRESH_INTERVAL) {
    refreshPool();
  }

  if (!state.ready || state.seeds.length === 0) {
    return Math.random();
  }

  // Cycle through the pool, mixing with the consumption index
  // to ensure uniqueness even when we wrap around
  const baseSeed = state.seeds[state.index % state.seeds.length];
  state.index++;

  // Mix the base seed with the index to avoid repeating identical values
  // Uses a simple hash-like mixing: fract(seed + index * golden_ratio)
  const golden = 0.6180339887498949;
  const mixed = (baseSeed + state.index * golden) % 1;

  return mixed;
}

/**
 * Whether the CURBy beacon has been successfully loaded.
 */
export function isCurbyReady(): boolean {
  return state.ready;
}

import { ITER_MIN, ITER_MAX } from "../constants";

/** Map an iteration count to a slider position in [0, 1] (logarithmic). */
export function iterToSlider(iter: number): number {
  return (
    (Math.log(iter) - Math.log(ITER_MIN)) /
    (Math.log(ITER_MAX) - Math.log(ITER_MIN))
  );
}

/** Map a slider position in [0, 1] back to an iteration count (logarithmic). */
export function sliderToIter(pos: number): number {
  return Math.round(
    Math.exp(
      Math.log(ITER_MIN) + pos * (Math.log(ITER_MAX) - Math.log(ITER_MIN)),
    ),
  );
}

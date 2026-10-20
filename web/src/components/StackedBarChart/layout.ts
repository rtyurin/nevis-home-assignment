export interface StackSegment {
  seriesId: string;
  value: number;
  /** Bottom and top of the segment in data units. */
  y0: number;
  y1: number;
  /** The highest visible segment of its bar; it carries the rounded cap. */
  isTop: boolean;
}

/**
 * Stacks one category: series are laid bottom-to-top in the given order.
 * Zero and negative values produce no segment.
 */
export function stackCategory(
  series: readonly { id: string; values: readonly number[] }[],
  index: number,
): StackSegment[] {
  const segments: StackSegment[] = [];
  let y = 0;
  for (const { id, values } of series) {
    const value = values[index] ?? 0;
    if (!(value > 0)) continue;
    segments.push({ seriesId: id, value, y0: y, y1: y + value, isTop: false });
    y += value;
  }
  const top = segments[segments.length - 1];
  if (top) top.isTop = true;
  return segments;
}

/** A 0-based linear axis with round tick steps (1, 2, 5 × 10ⁿ, never below 1). */
export function niceScale(max: number, targetTickCount = 4): { max: number; ticks: number[] } {
  if (!(max > 0)) return { max: 1, ticks: [0, 1] };
  const rough = max / targetTickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = Math.max(1, ([1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough));
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = 0; tick <= niceMax; tick += step) ticks.push(tick);
  return { max: niceMax, ticks };
}

/** SVG path for a bar with optionally rounded top corners. */
export function barPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, height, width / 2));
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `Q${x},${y} ${x + r},${y}`,
    `H${x + width - r}`,
    `Q${x + width},${y} ${x + width},${y + r}`,
    `V${y + height}`,
    'Z',
  ].join(' ');
}

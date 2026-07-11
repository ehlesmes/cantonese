export interface RectBounds {
  left: number;
  right: number;
}

export interface TooltipShiftResult {
  leftStyle: string;
  arrowOffsetStyle: string;
}

/**
 * Calculates tooltip boundary shifting to keep it within the viewport.
 * Returns shift styles or null if no shift is needed.
 */
export function calculateTooltipShift(
  rect: RectBounds,
  viewportWidth: number,
  padding = 12,
): TooltipShiftResult | null {
  const overflowLeft = padding - rect.left;
  const overflowRight = rect.right - (viewportWidth - padding);

  if (overflowLeft > 0) {
    return {
      leftStyle: `calc(50% + ${overflowLeft}px)`,
      arrowOffsetStyle: `calc(50% - ${overflowLeft}px)`,
    };
  } else if (overflowRight > 0) {
    return {
      leftStyle: `calc(50% - ${overflowRight}px)`,
      arrowOffsetStyle: `calc(50% + ${overflowRight}px)`,
    };
  }
  return null;
}

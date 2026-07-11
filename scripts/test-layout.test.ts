import { describe, test, expect } from "vitest";
import { calculateTooltipShift } from "../src/utils/layout.js";

describe("Tooltip Positioning Layout Math", () => {
  test("returns null if tooltip is completely within viewport", () => {
    const rect = { left: 50, right: 300 };
    const shift = calculateTooltipShift(rect, 390);
    expect(shift).toBeNull();
  });

  test("calculates correct shift when overflowing on the left", () => {
    // padding = 12, left = 5 -> overflowLeft = 12 - 5 = 7px
    const rect = { left: 5, right: 255 };
    const shift = calculateTooltipShift(rect, 390);
    expect(shift).toEqual({
      leftStyle: "calc(50% + 7px)",
      arrowOffsetStyle: "calc(50% - 7px)",
    });
  });

  test("calculates correct shift when overflowing on the right", () => {
    // padding = 12, right = 385, viewportWidth = 390 -> overflowRight = 385 - (390 - 12) = 385 - 378 = 7px
    const rect = { left: 135, right: 385 };
    const shift = calculateTooltipShift(rect, 390);
    expect(shift).toEqual({
      leftStyle: "calc(50% - 7px)",
      arrowOffsetStyle: "calc(50% + 7px)",
    });
  });
});

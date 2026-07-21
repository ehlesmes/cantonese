import { test, expect } from "./coverage-fixture.js";
import { devices } from "@playwright/test";

test.use({
  ...devices["iPhone 12"], // Configure viewport and UA for iPhone 12
});

test("Vocab tooltip should not overflow viewport on mobile devices", async ({
  page,
}) => {
  // Go to Chapter 1
  await page.goto("/cantonese/chapter/greetings");
  await expect(page.locator("h1").first()).toBeVisible();

  // Find a vocabulary term close to the left edge
  const term = page.locator(".vocab-term", { hasText: "拜拜" }).first();
  await expect(term).toBeVisible();

  // Scroll it into view
  await term.scrollIntoViewIfNeeded();

  // Get the popover element
  const popover = term.locator(".tooltip-popover");

  // Tap/Click the term to trigger the tooltip
  await term.click();

  // Wait for the popover to be visible and aligned
  await expect(popover).toBeVisible();
  await expect(popover).toHaveAttribute("style", /left|arrow-offset/);

  // Get bounding box dimensions
  const popoverRect = await popover.boundingBox();
  const viewportSize = page.viewportSize();

  expect(popoverRect).not.toBeNull();
  expect(viewportSize).not.toBeNull();

  if (popoverRect && viewportSize) {
    const padding = 0;
    console.log(
      `Mobile Tooltip Bounds - X: ${popoverRect.x}, Width: ${popoverRect.width}, Viewport Width: ${viewportSize.width}`,
    );

    // Assert that the popover stays completely within horizontal screen boundaries
    expect(popoverRect.x).toBeGreaterThanOrEqual(padding);
    expect(popoverRect.x + popoverRect.width).toBeLessThanOrEqual(
      viewportSize.width,
    );
  }
});

export {};

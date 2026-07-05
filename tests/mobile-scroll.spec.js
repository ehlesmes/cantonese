/* global document */
import { test, expect, devices } from "@playwright/test";

test.use({
  ...devices["iPhone 12"], // Viewport width: 390px
});

test("Mobile page should not have horizontal scroll", async ({ page }) => {
  // Go to greetings chapter page
  await page.goto("/cantonese/chapter/greetings");
  await page.waitForSelector("h1");

  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  const hasScroll = scrollWidth > clientWidth;

  console.log(
    `Mobile Viewport Width: ${clientWidth}px, Scrollable Width: ${scrollWidth}px`,
  );

  // The page should not exceed the mobile viewport bounds
  expect(hasScroll).toBe(false);
});

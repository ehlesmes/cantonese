import { test, expect } from "./coverage-fixture.js";
import { devices } from "@playwright/test";

test.use({
  ...devices["iPhone 12"], // Viewport width: 390px
});

const pagesToTest = [
  { name: "Home Page", path: "/cantonese" },
  { name: "Chapter Page", path: "/cantonese/chapter/greetings" },
  { name: "Phrasebook Page", path: "/cantonese/phrasebook" },
  { name: "Vocabulary Page", path: "/cantonese/vocabulary" },
  { name: "Advanced Page", path: "/cantonese/advanced" },
];

for (const targetPage of pagesToTest) {
  test(`${targetPage.name} should not have horizontal scroll`, async ({
    page,
  }) => {
    await page.goto(targetPage.path);
    await page.waitForLoadState("domcontentloaded");

    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
}

test("Sync Modal should not introduce horizontal scroll on mobile", async ({
  page,
}) => {
  await page.goto("/cantonese");
  await expect(page.locator("#sync-trigger-btn")).toBeVisible();

  // Open Sync Modal
  await page.locator("#sync-trigger-btn").click();
  await expect(page.locator("#sync-modal-overlay")).toHaveClass(/open/);

  const clientWidth = await page.evaluate(
    () => document.documentElement.clientWidth,
  );
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

export {};

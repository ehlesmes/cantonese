import { test as baseTest } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

export const test = baseTest.extend({
  page: async ({ page }, use, testInfo) => {
    // 1. Run the test block using the page
    await use(page);

    // 2. Capture coverage after the test finishes
    if (process.env.COVERAGE === "true") {
      try {
        const coverage = await page.evaluate(() => window.__coverage__);
        if (coverage) {
          const nycDir = path.resolve(".nyc_output");
          if (!fs.existsSync(nycDir)) {
            fs.mkdirSync(nycDir, { recursive: true });
          }
          // Generate a unique filename per test to avoid overwrites
          const safeTitle = testInfo.titlePath
            .join("-")
            .replace(/[^a-zA-Z0-9-_]/g, "_");
          fs.writeFileSync(
            path.join(nycDir, `playwright-${safeTitle}.json`),
            JSON.stringify(coverage),
          );
        }
      } catch (err) {
        console.warn(
          `[Coverage] Warning: Failed to retrieve coverage for "${testInfo.title}":`,
          err.message,
        );
      }
    }
  },
});

export { expect } from "@playwright/test";

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      process.env.COVERAGE === "true"
        ? "npm run dev -- --force"
        : "npm run dev",
    url: "http://localhost:4321/cantonese",
    reuseExistingServer: !process.env.COVERAGE,
    timeout: 120000,
  },
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: "review-browser.spec.ts",
  timeout: 30_000,
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:5173",
    serviceWorkers: "allow",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [
    ["list"],
    ["json", { outputFile: process.env.ILP_REVIEW_REPORT_FILE ?? "review-browser-results.json" }],
  ],
  outputDir: process.env.ILP_REVIEW_ARTIFACTS_DIR ?? "review-browser-artifacts",
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173/review/index.html",
    reuseExistingServer: true,
    timeout: 45_000,
  },
});

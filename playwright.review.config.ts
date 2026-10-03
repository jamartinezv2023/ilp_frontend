import { defineConfig, devices } from "@playwright/test";

const remoteBaseURL = process.env.ILP_REVIEW_BASE_URL;

export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: "review-browser.spec.ts",
  timeout: 30_000,
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: remoteBaseURL ?? "http://localhost:5173",
    serviceWorkers: "allow",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: [
    ["list"],
    ["json", { outputFile: process.env.ILP_REVIEW_REPORT_FILE ?? "review-browser-results.json" }],
  ],
  outputDir: process.env.ILP_REVIEW_ARTIFACTS_DIR ?? "review-browser-artifacts",
  webServer: remoteBaseURL ? undefined : {
    command: "npm run preview -- --host localhost --port 5173 --strictPort",
    url: "http://localhost:5173/review/index.html",
    reuseExistingServer: false,
    timeout: 45_000,
  },
});

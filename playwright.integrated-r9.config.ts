import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pilot", testMatch: "integrated-r9.spec.ts", workers: 1,
  fullyParallel: false, retries: 0, timeout: 60000,
  reporter: [["list"], ["junit", { outputFile: "test-results/integrated-r9-results.xml" }],
    ["html", { outputFolder: "playwright-report/integrated-r9", open: "never" }]],
  use: { baseURL: "http://127.0.0.1:15179", browserName: "chromium", screenshot: "only-on-failure",
    trace: "off", video: "off" },
});

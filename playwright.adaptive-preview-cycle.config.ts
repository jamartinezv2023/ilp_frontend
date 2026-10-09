import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: ["adaptive-preview-cycle.spec.ts"],
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "test-results/adaptive-preview-cycle",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/adaptive-preview-cycle", open: "never" }],
    ["junit", { outputFile: "test-results/adaptive-preview-cycle-results.xml" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5185",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 5185 --strictPort",
    url: "http://127.0.0.1:5185/",
    reuseExistingServer: false,
    env: {
      VITE_AUTH_API_BASE_URL: "http://127.0.0.1:5185",
      VITE_ADAPTIVE_API_BASE_URL: "http://127.0.0.1:5185",
      VITE_TENANT_ID: "00000000-0000-4000-8000-000000000000",
    },
  },
});
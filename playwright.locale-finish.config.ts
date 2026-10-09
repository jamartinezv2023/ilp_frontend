import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: ["locale-finish.spec.ts"],
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "test-results/locale-finish",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/locale-finish", open: "never" }],
    ["junit", { outputFile: "test-results/locale-finish-results.xml" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5186",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 5186 --strictPort",
    url: "http://127.0.0.1:5186/",
    reuseExistingServer: false,
    env: {
      VITE_AUTH_API_BASE_URL: "http://127.0.0.1:5186",
      VITE_ADAPTIVE_API_BASE_URL: "http://127.0.0.1:5186",
      VITE_TENANT_ID: "00000000-0000-4000-8000-000000000000",
    },
  },
});
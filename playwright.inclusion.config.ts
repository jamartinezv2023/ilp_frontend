import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: "inclusion-response.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "test-results/inclusion",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/inclusion", open: "never" }],
    ["junit", { outputFile: "test-results/inclusion-results.xml" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5174",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 5174 --strictPort",
    url: "http://127.0.0.1:5174/",
    reuseExistingServer: false,
    env: {
      VITE_AUTH_API_BASE_URL: "http://127.0.0.1:5174",
      VITE_ADAPTIVE_API_BASE_URL: "http://127.0.0.1:5174",
      VITE_TENANT_ID: "00000000-0000-4000-8000-000000000000",
    },
  },
});
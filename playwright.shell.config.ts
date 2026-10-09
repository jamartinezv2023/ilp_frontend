import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: "shell-layout.spec.ts",
  workers: 1,
  retries: 0,
  timeout: 30_000,
  outputDir: "test-results/shell",
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/shell", open: "never" }],
    ["junit", { outputFile: "test-results/shell-results.xml" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5181",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run build && npm run preview -- --host 127.0.0.1 --port 5181 --strictPort",
    url: "http://127.0.0.1:5181/",
    reuseExistingServer: false,
    env: {
      VITE_AUTH_API_BASE_URL: "http://127.0.0.1:5181",
      VITE_ADAPTIVE_API_BASE_URL: "http://127.0.0.1:5181",
      VITE_TENANT_ID: "00000000-0000-4000-8000-000000000000",
    },
  },
});
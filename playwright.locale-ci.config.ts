import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: /locale-(consistency|core)\.spec\.ts/,
  workers: 1,
  outputDir: "locale-browser-artifacts",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:5174",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5174 --strictPort",
    url: "http://127.0.0.1:5174/",
    reuseExistingServer: false,
    env: {
      VITE_AUTH_API_BASE_URL: "http://127.0.0.1:5174",
      VITE_ADAPTIVE_API_BASE_URL: "http://127.0.0.1:5174",
      VITE_TENANT_ID: "00000000-0000-4000-8000-000000000000",
    },
  },
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: "locale-core.spec.ts",
  workers: 1,
  use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5174" },
  webServer: {
    command: "npm run dev -- --host localhost --port 5174 --strictPort",
    url: "http://localhost:5174/",
    reuseExistingServer: false,
    env: {
      VITE_AUTH_API_BASE_URL: "http://localhost:5174",
      VITE_ADAPTIVE_API_BASE_URL: "http://localhost:5174",
      VITE_TENANT_ID: "00000000-0000-4000-8000-000000000000",
    },
  },
});

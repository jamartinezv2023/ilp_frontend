import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/pilot",
  testMatch: "synthetic-offline-queue.spec.ts",
  workers: 1,
  use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5174", serviceWorkers: "allow" },
  webServer: {
    command: "npm run preview -- --host localhost --port 5174 --strictPort",
    url: "http://localhost:5174/offline-lab/index.html",
    reuseExistingServer: false,
  },
});

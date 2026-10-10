import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/pilot', testMatch: 'synthetic-draft.spec.ts', workers: 1, retries: 0,
  outputDir: 'test-results/p02-draft',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report/p02-draft', open: 'never' }], ['junit', { outputFile: 'test-results/p02-draft-results.xml' }]],
  use: { baseURL: 'http://127.0.0.1:5188', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npx --no-install vite build --config vite.p02.config.ts && npx --no-install vite preview --config vite.p02.config.ts --host 127.0.0.1 --port 5188 --strictPort', url: 'http://127.0.0.1:5188/p02.html', reuseExistingServer: false },
});

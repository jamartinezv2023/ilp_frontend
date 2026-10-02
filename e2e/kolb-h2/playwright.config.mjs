import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';
export default defineConfig({ testDir: '.', testMatch: 'kolb.spec.mjs', workers: 1, timeout: 150000, use: { baseURL: 'http://127.0.0.1:5178', trace: 'retain-on-failure', screenshot: 'only-on-failure' }, webServer: { cwd: fileURLToPath(new URL('../../', import.meta.url)), command: 'node node_modules/vite/bin/vite.js --config e2e/kolb-h2/vite.config.mjs', url: 'http://127.0.0.1:5178/e2e/kolb-h2/index.html', reuseExistingServer: false, env: { VITE_ADAPTIVE_API_BASE_URL: 'http://127.0.0.1:5178' } } });

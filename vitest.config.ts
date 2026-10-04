import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    env: { VITE_ADAPTIVE_API_BASE_URL: 'https://adaptive.example.test',
      VITE_AUTH_API_BASE_URL: 'https://auth.example.test',
      VITE_TENANT_ID: '11111111-1111-4111-8111-111111111111' },
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'lcov', 'json-summary'], reportsDirectory: 'coverage' },
  },
});

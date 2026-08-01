import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  workers: 1,
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})

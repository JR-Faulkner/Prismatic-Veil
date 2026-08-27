import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    // Vite owns browser-test serving so TypeScript probe modules are
    // transpiled exactly as they are during modernization development.
    // The Vite dev server still serves the repository root, so the
    // existing PV menu, hybrid shell and assets remain testable too.
    command: 'npx vite --host 127.0.0.1 --port 4173 --strictPort --config vite.config.ts',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 15_000
  },
  projects: [
    {
      name: 'chromium-phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 844, height: 390 }
      }
    },
    {
      name: 'webkit-phone',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 844, height: 390 }
      }
    },
    {
      name: 'webkit-portrait',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 390, height: 844 }
      }
    }
  ]
});

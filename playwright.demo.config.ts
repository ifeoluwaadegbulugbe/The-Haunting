import { defineConfig } from '@playwright/test'

// Records the demo video: `npx playwright test -c playwright.demo.config.ts`, then `node scripts/make-demo.mjs`.
export default defineConfig({
  testDir: './tests/demo',
  timeout: 360_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  outputDir: 'test-results/demo-raw',
  use: {
    baseURL: 'http://localhost:3100',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    reducedMotion: 'no-preference',
    actionTimeout: 20_000,
  },
  webServer: {
    command: 'npx next start -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 120_000,
    env: { AI_MOCK: '1' },
  },
})

import { defineConfig, devices } from "@playwright/test";

const frontendPort = 3000;
const apiPort = Number(process.env.E2E_MOCK_API_PORT || 3001);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://127.0.0.1:${frontendPort}`,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node ../scripts/e2e-mock-api.mjs",
      url: `http://127.0.0.1:${apiPort}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `npx next dev --port ${frontendPort}`,
      url: `http://127.0.0.1:${frontendPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        ...process.env,
        APTUS_API_URL: `http://127.0.0.1:${apiPort}`,
        NEXT_PUBLIC_API_URL: `http://127.0.0.1:${apiPort}`,
      },
    },
  ],
});

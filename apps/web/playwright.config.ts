import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node e2e/admin-mock-api.mjs",
      url: "http://127.0.0.1:4400/health",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm exec next dev --hostname 127.0.0.1 --port 3100",
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: "development",
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:4400",
        NEXT_PUBLIC_SITE_URL: baseURL,
      },
    },
  ],
});

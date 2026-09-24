import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "https://3000-ium9h174mhsyzxu27i3xl-c5f0762b.sg2.manus.computer",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chromium" } }],
});

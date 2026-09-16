import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", {open: "never"}]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    // Keep evidence for successful UAT runs too: the report is an executable
    // record of what a user could see and do, not only a failure debugger.
    trace: "on",
    screenshot: "on",
    video: "on",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [{name: "chromium", use: {...devices["Desktop Chrome"]}}],
});

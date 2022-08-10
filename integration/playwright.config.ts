import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: ".",
  testMatch: ["**/*-test.ts"],
  /* Maximum time one test can run for. */
  timeout: process.platform === "win32" ? 60_000 : 30_000,
  fullyParallel: true,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5_000,
  },
  forbidOnly: !!process.env.CI,
  retries: 3,
  reporter: process.env.CI ? "github" : [["html", { open: "never" }]],
  use: { actionTimeout: 0 },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
};

export default config;

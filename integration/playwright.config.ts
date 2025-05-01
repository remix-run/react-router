import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

// silence expected warnings in Node 22.12 about `require(esm)`
// when it implicitly uses `react-router`'s `module-sync` export condition
process.env.NODE_OPTIONS =
  (process.env.NODE_OPTIONS ?? "") + ` --no-warnings=ExperimentalWarning`;

const isWindows = process.platform === "win32";

const config: PlaywrightTestConfig = {
  testDir: ".",
  testMatch: ["**/*-test.ts"],
  // Playwright treats our workspace packages as internal by default. If we
  // don't mark them as external, tests hang in Node 20.5.2+
  build: {
    external: ["**/packages/**/*"],
  },
  /* Maximum time one test can run for. */
  timeout: isWindows ? 60_000 : 30_000,
  fullyParallel: true,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: isWindows ? 10_000 : 5_000,
  },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  reporter: process.env.CI ? "dot" : [["html", { open: "never" }]],
  use: { actionTimeout: 0 },

  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
    {
      name: "webkit",
      use: devices["Desktop Safari"],
    },
    {
      name: "msedge",
      use: {
        ...devices["Desktop Edge"],
        // Desktop Edge uses chromium by default
        // https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json#L1502
        channel: "msedge",
      },
    },
    {
      name: "firefox",
      use: devices["Desktop Firefox"],
    },
  ],
};

export default config;

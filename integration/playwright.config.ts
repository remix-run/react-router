import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  testDir: ".",
  testMatch: ["**/*-test.ts"],
  // TODO: Temporary!  Remove from this list as we get each suite passing
  testIgnore: [
    "**/error-sanitization-test.ts",
    "**/file-uploads-test.ts",
    "**/resource-routes-test.ts",
    "**/vite-basename-test.ts",
    "**/vite-build-test.ts",
    "**/vite-cloudflare-test.ts",
    "**/vite-css-test.ts",
    "**/vite-dev-test.ts",
    "**/vite-dot-server-test.ts",
    "**/vite-hmr-hdr-test.ts",
    "**/vite-plugin-order-validation-test.ts",
    "**/vite-spa-mode-test.ts",
  ],
  /* Maximum time one test can run for. */
  timeout: process.platform === "win32" ? 60_000 : 30_000,
  fullyParallel: true,
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5_000,
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

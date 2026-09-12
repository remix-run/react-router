import { detectPackageManager } from "../cli/detectPackageManager";

describe("detectPackageManager", () => {
  let originalUserAgent = process.env.npm_config_user_agent;

  afterEach(() => {
    process.env.npm_config_user_agent = originalUserAgent;
  });

  it.each(["npm", "pnpm", "yarn", "bun", "nub"] as const)(
    "detects %s from the user agent",
    (packageManager) => {
      process.env.npm_config_user_agent = `${packageManager}/1.0.0 npm/? node/v24.0.0 linux x64`;

      expect(detectPackageManager()).toBe(packageManager);
    },
  );

  it("returns undefined for unknown package managers", () => {
    process.env.npm_config_user_agent =
      "unknown/1.0.0 npm/? node/v24.0.0 linux x64";

    expect(detectPackageManager()).toBeUndefined();
  });

  it("returns undefined without a user agent", () => {
    process.env.npm_config_user_agent = undefined;

    expect(detectPackageManager()).toBeUndefined();
  });
});

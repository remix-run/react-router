import {
  restartWithMergedOptions,
  resolveRestartSpawn,
} from "../restart-with-conditions";

describe("resolveRestartSpawn", () => {
  it("inserts extra flags into argv and leaves NODE_OPTIONS unchanged", () => {
    let result = resolveRestartSpawn(
      ["/usr/bin/node", "/app/cli.js", "dev"],
      "--conditions=development",
      { NODE_OPTIONS: "--max-old-space-size=2048", PATH: "/bin" },
    );

    expect(result.command).toBe("/usr/bin/node");
    expect(result.args).toEqual([
      "--conditions=development",
      "/app/cli.js",
      "dev",
    ]);
    expect(result.env.REACT_ROUTER_DEV_RESTARTED).toBe("true");
    expect(result.env.NODE_OPTIONS).toBe("--max-old-space-size=2048");
    expect(result.env.PATH).toBe("/bin");
  });

  it("still relaunches when NODE_OPTIONS is unset", () => {
    let result = resolveRestartSpawn(
      ["/usr/bin/bun", "/app/cli.js", "dev"],
      "--conditions=development",
      {},
    );

    expect(result.command).toBe("/usr/bin/bun");
    expect(result.args[0]).toBe("--conditions=development");
    expect(result.env.NODE_OPTIONS).toBeUndefined();
  });
});

describe("restartWithMergedOptions", () => {
  let originalRestarted: string | undefined;

  beforeEach(() => {
    originalRestarted = process.env.REACT_ROUTER_DEV_RESTARTED;
    delete process.env.REACT_ROUTER_DEV_RESTARTED;
  });

  afterEach(() => {
    if (originalRestarted === undefined) {
      delete process.env.REACT_ROUTER_DEV_RESTARTED;
    } else {
      process.env.REACT_ROUTER_DEV_RESTARTED = originalRestarted;
    }
  });

  it("throws if the process has already been restarted", () => {
    process.env.REACT_ROUTER_DEV_RESTARTED = "true";
    expect(() => restartWithMergedOptions("--conditions=development")).toThrow(
      /already been restarted/,
    );
  });
});

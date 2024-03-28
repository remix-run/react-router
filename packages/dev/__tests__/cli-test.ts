import childProcess from "node:child_process";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import fse from "fs-extra";

let execFile = util.promisify(childProcess.execFile);

const TEMP_DIR = path.join(
  fse.realpathSync(os.tmpdir()),
  `rr-tests-${Math.random().toString(32).slice(2)}`
);

jest.setTimeout(30_000);
beforeAll(async () => {
  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
});

afterAll(async () => {
  await fse.remove(TEMP_DIR);
});

async function execCli(
  args: Array<string>,
  options: Exclude<Parameters<typeof execFile>[2], null | undefined> = {}
) {
  if (process.platform === "win32") {
    let cp = childProcess.spawnSync(
      "node",
      [
        "--require",
        require.resolve("esbuild-register"),
        path.resolve(__dirname, "../cli.ts"),
        ...args,
      ],
      {
        cwd: TEMP_DIR,
        ...options,
        env: {
          ...process.env,
          NO_COLOR: "1",
          ...options.env,
        },
      }
    );

    return {
      stdout: cp.stdout?.toString("utf-8"),
    };
  } else {
    let result = await execFile(
      "node",
      [
        "--require",
        require.resolve("esbuild-register"),
        path.resolve(__dirname, "../cli.ts"),
        ...args,
      ],
      {
        cwd: TEMP_DIR,
        ...options,
        env: {
          ...process.env,
          NO_COLOR: "1",
          ...options.env,
        },
      }
    );
    return {
      ...result,
      stdout: result.stdout.replace(TEMP_DIR, "<TEMP_DIR>").trim(),
    };
  }
}

describe("rr CLI", () => {
  describe("the --help flag", () => {
    it("prints top-level help info", async () => {
      let { stdout } = await execCli(["--help"]);
      let version = require("../package.json").version;
      expect(stdout.trim().replace(version, "[VERSION]"))
        .toMatchInlineSnapshot(`
        "rr/[VERSION]

        Usage:
          $ rr <command> [options]

        Commands:
          dev [root]    build for production
          build [root]  build for production

        For more info, run any command with the \`--help\` flag:
          $ rr dev --help
          $ rr build --help

        Options:
          -v, --version  Display version number 
          -h, --help     Display this message"
      `);
    });

    it("prints dev help info", async () => {
      let { stdout } = await execCli(["dev", "--help"]);
      let version = require("../package.json").version;
      expect(stdout.trim().replace(version, "[VERSION]"))
        .toMatchInlineSnapshot(`
        "rr/[VERSION]

        Usage:
          $ rr dev [root]

        Options:
          --clearScreen           Allow/disable clear screen when logging (boolean) 
          -c, --config <file>     Use specified config file (string) 
          --cors                  Enable CORS (boolean) 
          --force                 Force the optimizer to ignore the cache and re-bundle (boolean) 
          --host [host]           Specify hostname (string) 
          -l, --logLevel <level>  Info | warn | error | silent (string) 
          -m, --mode <mode>       Set env mode (string) 
          --open                  Open browser on startup (boolean | string) 
          --port <port>           Specify port (number) 
          --profile               Start built-in Node.js inspector 
          --strictPort            Exit if specified port is already in use (boolean) 
          -h, --help              Display this message"
      `);
    });

    it("prints build help info", async () => {
      let { stdout } = await execCli(["build", "--help"]);
      let version = require("../package.json").version;
      expect(stdout.trim().replace(version, "[VERSION]"))
        .toMatchInlineSnapshot(`
        "rr/[VERSION]

        Usage:
          $ rr build [root]

        Options:
          --assetsInlineLimit <number>  Static asset base64 inline threshold in bytes (default: 4096) (number) 
          --clearScreen                 Allow/disable clear screen when logging (boolean) 
          -c, --config <file>           Use specified config file (string) 
          --emptyOutDir                 Force empty outDir when it's outside of root (boolean) 
          -l, --logLevel <level>        Info | warn | error | silent (string) 
          --minify [minifier]           Enable/disable minification, or specify minifier to use (default: "esbuild") (boolean | "terser" | "esbuild") 
          -m, --mode <mode>             Set env mode (string) 
          --profile                     Start built-in Node.js inspector 
          --sourcemapClient [output]    Output source maps for client build (default: false) (boolean | "inline" | "hidden") 
          --sourcemapServer [output]    Output source maps for server build (default: false) (boolean | "inline" | "hidden") 
          -h, --help                    Display this message"
      `);
    });
  });
});

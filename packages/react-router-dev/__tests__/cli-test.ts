import childProcess from "node:child_process";
import os from "node:os";
import path from "node:path";
import util from "node:util";
import fse from "fs-extra";
import semver from "semver";

let execFile = util.promisify(childProcess.execFile);

const TEMP_DIR = path.join(
  fse.realpathSync(os.tmpdir()),
  `remix-tests-${Math.random().toString(32).slice(2)}`
);

jest.setTimeout(30_000);
beforeAll(async () => {
  await fse.remove(TEMP_DIR);
  await fse.ensureDir(TEMP_DIR);
});

afterAll(async () => {
  await fse.remove(TEMP_DIR);
});

async function execRemix(
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

describe("remix CLI", () => {
  describe("the --help flag", () => {
    it("prints help info", async () => {
      let { stdout } = await execRemix(["--help"]);
      expect(stdout.trim()).toMatchInlineSnapshot(`
        "react-router

          Usage:
            $ react-router build [projectDir]
            $ react-router dev [projectDir]
            $ react-router routes [projectDir]

          Options:
            --help, -h          Print this help message and exit
            --version, -v       Print the CLI version and exit
            --no-color          Disable ANSI colors in console output
          \`build\` Options:
            --assetsInlineLimit Static asset base64 inline threshold in bytes (default: 4096) (number)
            --clearScreen       Allow/disable clear screen when logging (boolean)
            --config, -c        Use specified config file (string)
            --emptyOutDir       Force empty outDir when it's outside of root (boolean)
            --logLevel, -l      Info | warn | error | silent (string)
            --minify            Enable/disable minification, or specify minifier to use (default: "esbuild") (boolean | "terser" | "esbuild")
            --mode, -m          Set env mode (string)
            --profile           Start built-in Node.js inspector
            --sourcemapClient   Output source maps for client build (default: false) (boolean | "inline" | "hidden")
            --sourcemapServer   Output source maps for server build (default: false) (boolean | "inline" | "hidden")
          \`dev\` Options:
            --clearScreen       Allow/disable clear screen when logging (boolean)
            --config, -c        Use specified config file (string)
            --cors              Enable CORS (boolean)
            --force             Force the optimizer to ignore the cache and re-bundle (boolean)
            --host              Specify hostname (string)
            --logLevel, -l      Info | warn | error | silent (string)
            --mode, -m          Set env mode (string)
            --open              Open browser on startup (boolean | string)
            --port              Specify port (number)
            --profile           Start built-in Node.js inspector
            --strictPort        Exit if specified port is already in use (boolean)
          \`routes\` Options:
            --config, -c        Use specified Vite config file (string)
            --json              Print the routes as JSON
          \`reveal\` Options:
            --config, -c        Use specified Vite config file (string)
            --no-typescript     Generate plain JavaScript files

          Build your project:

            $ react-router build

          Run your project locally in development:

            $ react-router dev

          Show all routes in your app:

            $ react-router routes
            $ react-router routes my-app
            $ react-router routes --json
            $ react-router routes --config vite.react-router.config.ts

          Reveal the used entry point:

            $ react-router reveal entry.client
            $ react-router reveal entry.server
            $ react-router reveal entry.client --no-typescript
            $ react-router reveal entry.server --no-typescript
            $ react-router reveal entry.server --config vite.react-router.config.ts"
      `);
    });
  });

  describe("the --version flag", () => {
    it("prints the current version", async () => {
      let { stdout } = await execRemix(["--version"]);
      expect(!!semver.valid(stdout.trim())).toBe(true);
    });
  });
});

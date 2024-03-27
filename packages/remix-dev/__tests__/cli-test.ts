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
        "R E M I X

          Usage:
            $ remix init [projectDir]
            $ remix vite:build [projectDir]
            $ remix vite:dev [projectDir]
            $ remix build [projectDir]
            $ remix dev [projectDir]
            $ remix routes [projectDir]
            $ remix watch [projectDir]

          Options:
            --help, -h          Print this help message and exit
            --version, -v       Print the CLI version and exit
            --no-color          Disable ANSI colors in console output
          \`vite:build\` Options (Passed through to Vite):
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
          \`build\` Options:
            --sourcemap         Generate source maps for production
          \`vite:dev\` Options (Passed through to Vite):
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
          \`dev\` Options:
            --command, -c       Command used to run your app server
            --manual            Enable manual mode
            --port              Port for the dev server. Default: any open port
            --tls-key           Path to TLS key (key.pem)
            --tls-cert          Path to TLS certificate (cert.pem)
          \`init\` Options:
            --no-delete         Skip deleting the \`remix.init\` script
          \`routes\` Options:
            --config, -c        Use specified Vite config file (string)
            --json              Print the routes as JSON
          \`reveal\` Options:
            --config, -c        Use specified Vite config file (string)
            --no-typescript     Generate plain JavaScript files

          Values:
            - projectDir        The Remix project directory
            - remixPlatform     \`node\` or \`cloudflare\`

          Initialize a project::

            Remix project templates may contain a \`remix.init\` directory
            with a script that initializes the project. This script automatically
            runs during \`remix create\`, but if you ever need to run it manually
            (e.g. to test it out) you can:

            $ remix init

          Build your project (Vite):

            $ remix vite:build

          Run your project locally in development (Vite):

            $ remix vite:dev

          Build your project (Classic compiler):

            $ remix build
            $ remix build --sourcemap
            $ remix build my-app

          Run your project locally in development (Classic compiler):

            $ remix dev
            $ remix dev -c "node ./server.js"

          Start your server separately and watch for changes (Classic compiler):

            # custom server start command, for example:
            $ remix watch

            # in a separate tab:
            $ node --inspect --require ./node_modules/dotenv/config --require ./mocks ./build/server.js

          Show all routes in your app:

            $ remix routes
            $ remix routes my-app
            $ remix routes --json
            $ remix routes --config vite.remix.config.ts

          Reveal the used entry point:

            $ remix reveal entry.client
            $ remix reveal entry.server
            $ remix reveal entry.client --no-typescript
            $ remix reveal entry.server --no-typescript
            $ remix reveal entry.server --config vite.remix.config.ts"
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

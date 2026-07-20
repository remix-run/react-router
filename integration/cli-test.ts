import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import dedent from "dedent";
import getPort from "get-port";
import semver from "semver";

import { build, createProject, reactRouterConfig } from "./helpers/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(__dirname, "..");
const nodeBin = process.argv[0];
const reactRouterBin = "node_modules/@react-router/dev/dist/cli/index.js";
const reactRouterPackageBinPath = "node_modules/@react-router/dev/bin.cjs";
const reactRouterPackageBin = path.join(
  rootDirectory,
  "packages/react-router-dev/bin.cjs",
);

const run = (command: string[], options: Parameters<typeof spawnSync>[2]) =>
  spawnSync(nodeBin, [reactRouterBin, ...command], options);

function bufferize(stream: NodeJS.ReadableStream | null): () => string {
  let buffer = "";
  stream?.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function restartCount(output: string) {
  return (
    output.match(/\[restart\] Relaunching with NODE_OPTIONS:/g)?.length ?? 0
  );
}

function getLogs(stdout: string, stderr: string) {
  return [
    `stdout:\n${stdout || "<empty>"}`,
    `stderr:\n${stderr || "<empty>"}`,
  ].join("\n\n");
}

async function waitForDevServer(args: {
  port: number;
  proc: ChildProcess;
  stdout: () => string;
  stderr: () => string;
}) {
  let timeout = process.platform === "win32" ? 20_000 : 10_000;
  let start = Date.now();
  let lastError: unknown;

  while (Date.now() - start < timeout) {
    let stdout = args.stdout();
    let stderr = args.stderr();

    if (restartCount(stdout) > 1) {
      throw new Error(
        `Expected react-router dev to restart once, but it restarted ${restartCount(
          stdout,
        )} times.\n\n${getLogs(stdout, stderr)}`,
      );
    }

    if (args.proc.exitCode !== null || args.proc.signalCode !== null) {
      throw new Error(
        `react-router dev exited before the server started.\n\n${getLogs(
          stdout,
          stderr,
        )}`,
      );
    }

    try {
      let response = await fetch(`http://127.0.0.1:${args.port}/`, {
        signal: AbortSignal.timeout(1_000),
      });
      let html = await response.text();
      if (response.ok && html.includes("Welcome to React Router")) {
        return;
      }
      lastError = new Error(`Unexpected response ${response.status}: ${html}`);
    } catch (error) {
      lastError = error;
    }

    await delay(100);
  }

  throw new Error(
    [
      `Timed out waiting for react-router dev to start: ${String(lastError)}`,
      getLogs(args.stdout(), args.stderr()),
    ].join("\n\n"),
  );
}

function waitForExit(proc: ChildProcess, timeout: number) {
  return new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
    (resolve, reject) => {
      if (proc.exitCode !== null || proc.signalCode !== null) {
        resolve({ code: proc.exitCode, signal: proc.signalCode });
        return;
      }

      let timer = setTimeout(() => {
        reject(new Error("Timed out waiting for react-router dev to exit"));
      }, timeout);

      proc.once("exit", (code, signal) => {
        clearTimeout(timer);
        resolve({ code, signal });
      });
    },
  );
}

function killProcessGroup(proc: ChildProcess) {
  if (proc.exitCode !== null || proc.signalCode !== null) {
    return;
  }

  if (proc.pid && process.platform !== "win32") {
    try {
      process.kill(-proc.pid, "SIGKILL");
      return;
    } catch {
      // Fall back to killing just the parent process below.
    }
  }

  proc.kill("SIGKILL");
}

const getBinNodeEnv = (command: string[]) => {
  let cwd = mkdtempSync(path.join(tmpdir(), "react-router-bin-"));
  let env = { ...process.env };
  delete env.NODE_ENV;

  try {
    mkdirSync(path.join(cwd, "dist/cli"), { recursive: true });
    copyFileSync(reactRouterPackageBin, path.join(cwd, "bin.cjs"));
    writeFileSync(
      path.join(cwd, "dist/cli/index.js"),
      "console.log(process.env.NODE_ENV);",
    );

    let { stdout, stderr, status } = spawnSync(
      nodeBin,
      ["bin.cjs", ...command],
      { cwd, env },
    );
    expect(stderr.toString()).toBe("");
    expect(status).toBe(0);
    return stdout.toString().trim();
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
};

const helpText = dedent`
  react-router

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
    \`typegen\` Options:
      --watch             Automatically regenerate types whenever route config (\`routes.ts\`) or route modules change

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
      $ react-router reveal entry.server --config vite.react-router.config.ts

    Generate types for route modules:

     $ react-router typegen
     $ react-router typegen --watch
`;

test.describe("cli", () => {
  test("--help", async () => {
    const cwd = await createProject();
    const { stdout, stderr, status } = run(["--help"], {
      cwd,
      env: {
        NO_COLOR: "1",
      },
    });
    expect(stdout.toString().trim()).toBe(helpText);
    expect(stderr.toString()).toBe("");
    expect(status).toBe(0);
  });

  test("--version", async () => {
    const cwd = await createProject();
    let { stdout, stderr, status } = run(["--version"], { cwd });
    expect(semver.valid(stdout.toString().trim())).not.toBeNull();
    expect(stderr.toString()).toBe("");
    expect(status).toBe(0);
  });

  test("bin sets NODE_ENV based on the positional command", async () => {
    expect(getBinNodeEnv(["dev", "--host", "127.0.0.1"])).toBe("development");
    expect(getBinNodeEnv(["--host", "127.0.0.1", "dev"])).toBe("development");
    expect(getBinNodeEnv(["build", "--mode", "development"])).toBe(
      "production",
    );
    expect(getBinNodeEnv(["--mode", "development", "build"])).toBe(
      "production",
    );
  });

  test("dev restarts with the development condition and starts the server", async ({
    browserName: _browserName,
  }, { project }) => {
    test.skip(
      project.name !== "chromium",
      "CLI smoke test only needs one browser project",
    );

    let cwd = await createProject();
    let port = await getPort();
    let proc = spawn(
      nodeBin,
      [
        reactRouterPackageBinPath,
        "dev",
        "--host",
        "127.0.0.1",
        "--port",
        String(port),
        "--strictPort",
      ],
      {
        cwd,
        detached: process.platform !== "win32",
        env: {
          ...process.env,
          FORCE_COLOR: undefined,
          NO_COLOR: "1",
          NODE_OPTIONS: "--no-warnings=ExperimentalWarning",
        },
        stdio: "pipe",
      },
    );
    let stdout = bufferize(proc.stdout);
    let stderr = bufferize(proc.stderr);

    try {
      await waitForDevServer({ port, proc, stdout, stderr });
      expect(restartCount(stdout())).toBe(1);

      proc.kill("SIGTERM");
      await expect(waitForExit(proc, 5_000)).resolves.toBeDefined();
    } catch (error) {
      throw new Error(
        [
          error instanceof Error ? error.message : String(error),
          getLogs(stdout(), stderr()),
        ].join("\n\n"),
      );
    } finally {
      killProcessGroup(proc);
    }
  });

  test("routes", async () => {
    const cwd = await createProject();
    let { stdout, stderr, status } = run(["routes"], { cwd });

    // Filter out future flag warnings for the format:
    // ⚠️  Future Flag Warning: [Something] is changing in React Router v8.
    //     You can use the `future.v8_[whatever]` flag to opt in early.
    //     -> https://reactrouter.com/upgrading/future-flags#v8_[whatever]
    let filteredStdOut = stdout.toString().split("\n");
    while (filteredStdOut[0]?.includes("Future Flag Warning:")) {
      filteredStdOut.splice(0, 3);
    }

    expect(filteredStdOut.join("\n").trim()).toBe(dedent`
      <Routes>
        <Route file="root.tsx">
          <Route index file="routes/_index.tsx" />
        </Route>
      </Routes>
    `);
    expect(stderr.toString()).toBe("");
    expect(status).toBe(0);
  });

  test.describe("reveal", async () => {
    test("generates entry.{server,client}.tsx in the app directory", async () => {
      const cwd = await createProject();
      let entryClientFile = path.join(cwd, "app", "entry.client.tsx");
      let entryServerFile = path.join(cwd, "app", "entry.server.tsx");

      expect(existsSync(entryServerFile)).toBeFalsy();
      expect(existsSync(entryClientFile)).toBeFalsy();

      run(["reveal"], { cwd });

      expect(existsSync(entryServerFile)).toBeTruthy();
      expect(existsSync(entryClientFile)).toBeTruthy();
      expect(readFileSync(entryServerFile, "utf-8")).toContain(
        "renderToPipeableStream",
      );
    });

    test("generates a web server entry for non-Node projects", async () => {
      const cwd = await createProject();
      let packageJsonPath = path.join(cwd, "package.json");
      let pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      delete pkg.dependencies["@react-router/express"];
      delete pkg.dependencies["@react-router/node"];
      delete pkg.dependencies["@react-router/serve"];
      writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));

      let entryServerFile = path.join(cwd, "app", "entry.server.tsx");

      expect(existsSync(entryServerFile)).toBeFalsy();

      run(["reveal", "entry.server"], { cwd });

      expect(existsSync(entryServerFile)).toBeTruthy();
      expect(readFileSync(entryServerFile, "utf-8")).toContain(
        "renderToReadableStream",
      );
    });

    test("generates a web server entry for Node projects with the readable stream future flag", async () => {
      const cwd = await createProject({
        "react-router.config.ts": reactRouterConfig({
          future: {
            unstable_enableNodeReadableStream: true,
          },
        }),
      });

      let entryServerFile = path.join(cwd, "app", "entry.server.tsx");

      expect(existsSync(entryServerFile)).toBeFalsy();

      run(["reveal", "entry.server"], { cwd });

      expect(existsSync(entryServerFile)).toBeTruthy();
      expect(readFileSync(entryServerFile, "utf-8")).toContain(
        "renderToReadableStream",
      );
    });

    test("rsc generates entry.{ssr,rsc,client}.tsx in the app directory", async () => {
      const cwd = await createProject({}, "rsc-vite-framework");
      let entrySSRFile = path.join(cwd, "app", "entry.ssr.tsx");
      let entryRSCFile = path.join(cwd, "app", "entry.rsc.tsx");
      let entryClientFile = path.join(cwd, "app", "entry.client.tsx");

      expect(existsSync(entrySSRFile)).toBeFalsy();
      expect(existsSync(entryRSCFile)).toBeFalsy();
      expect(existsSync(entryClientFile)).toBeFalsy();

      run(["reveal"], { cwd });

      expect(existsSync(entrySSRFile)).toBeTruthy();
      expect(existsSync(entryRSCFile)).toBeTruthy();
      expect(existsSync(entryClientFile)).toBeTruthy();
    });

    test("generates specified entries in the app directory", async () => {
      const cwd = await createProject();

      let entryClientFile = path.join(cwd, "app", "entry.client.tsx");
      let entryServerFile = path.join(cwd, "app", "entry.server.tsx");

      expect(existsSync(entryServerFile)).toBeFalsy();
      expect(existsSync(entryClientFile)).toBeFalsy();

      run(["reveal", "entry.server"], { cwd });
      expect(existsSync(entryServerFile)).toBeTruthy();
      expect(existsSync(entryClientFile)).toBeFalsy();
      rmSync(entryServerFile);

      run(["reveal", "entry.client"], { cwd });
      expect(existsSync(entryClientFile)).toBeTruthy();
      expect(existsSync(entryServerFile)).toBeFalsy();
    });

    test("generates entry.{server,client}.jsx in the app directory with --no-typescript", async () => {
      const cwd = await createProject();
      let entryClientFile = path.join(cwd, "app", "entry.client.jsx");
      let entryServerFile = path.join(cwd, "app", "entry.server.jsx");

      expect(existsSync(entryServerFile)).toBeFalsy();
      expect(existsSync(entryClientFile)).toBeFalsy();

      run(["reveal", "--no-typescript"], { cwd });

      expect(existsSync(entryServerFile)).toBeTruthy();
      expect(existsSync(entryClientFile)).toBeTruthy();
    });
  });

  test("builds a Node project with the readable stream future flag and default server entry", async () => {
    const cwd = await createProject({
      "react-router.config.ts": reactRouterConfig({
        future: {
          unstable_enableNodeReadableStream: true,
        },
      }),
    });

    const buildResult = build({ cwd });

    expect(buildResult.status).toBe(0);
  });
});

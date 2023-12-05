import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import type { Readable } from "node:stream";
import url from "node:url";
import execa from "execa";
import fse from "fs-extra";
import stripIndent from "strip-indent";
import waitOn from "wait-on";
import getPort from "get-port";
import shell from "shelljs";
import glob from "glob";

const remixBin = "node_modules/@remix-run/dev/dist/cli.js";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const VITE_CONFIG = async (args: {
  port: number;
  vitePlugins?: string;
}) => {
  let hmrPort = await getPort();
  return String.raw`
    import { defineConfig } from "vite";
    import { unstable_vitePlugin as remix } from "@remix-run/dev";

    export default defineConfig({
      server: {
        port: ${args.port},
        strictPort: true,
        hmr: {
          port: ${hmrPort}
        }
      },
      plugins: [remix(),${args.vitePlugins ?? ""}],
    });
  `;
};

export const EXPRESS_SERVER = (args: {
  port: number;
  loadContext?: Record<string, unknown>;
}) =>
  String.raw`
    import { unstable_viteServerBuildModuleId } from "@remix-run/dev";
    import { createRequestHandler } from "@remix-run/express";
    import { installGlobals } from "@remix-run/node";
    import express from "express";

    installGlobals();

    let vite =
      process.env.NODE_ENV === "production"
        ? undefined
        : await import("vite").then(({ createServer }) =>
            createServer({
              server: { middlewareMode: true },
            })
          );

    const app = express();

    if (vite) {
      app.use(vite.middlewares);
    } else {
      app.use(
        "/assets",
        express.static("build/client/assets", { immutable: true, maxAge: "1y" })
      );
    }
    app.use(express.static("build/client", { maxAge: "1h" }));

    app.all(
      "*",
      createRequestHandler({
        build: vite
          ? () => vite.ssrLoadModule(unstable_viteServerBuildModuleId)
          : await import("./build/index.js"),
        getLoadContext: () => (${JSON.stringify(args.loadContext ?? {})}),
      })
    );

    const port = ${args.port};
    app.listen(port, () => console.log('http://localhost:' + port));
  `;

const TMP_DIR = path.join(process.cwd(), ".tmp/integration");
export async function createProject(files: Record<string, string> = {}) {
  let projectName = `remix-${Math.random().toString(32).slice(2)}`;
  let projectDir = path.join(TMP_DIR, projectName);
  await fse.ensureDir(projectDir);

  // base template
  let template = path.resolve(__dirname, "vite-template");
  await fse.copy(template, projectDir, { errorOnExist: true });

  // user-defined files
  await Promise.all(
    Object.entries(files).map(async ([filename, contents]) => {
      let filepath = path.join(projectDir, filename);
      await fse.ensureDir(path.dirname(filepath));
      await fse.writeFile(filepath, stripIndent(contents));
    })
  );

  // node_modules: overwrite with locally built Remix packages
  await fse.copy(
    path.join(__dirname, "../../build/node_modules"),
    path.join(projectDir, "node_modules"),
    { overwrite: true }
  );

  return projectDir;
}

type ServerArgs = {
  cwd: string;
  port: number;
};

const createDev =
  (nodeArgs: string[]) =>
  async ({ cwd, port }: ServerArgs): Promise<() => Promise<void>> => {
    let proc = node(nodeArgs, { cwd });
    await waitForServer(proc, { port });
    return async () => await kill(proc.pid!);
  };

export const viteBuild = ({ cwd }: { cwd: string }) => {
  let nodeBin = process.argv[0];

  return spawnSync(nodeBin, [remixBin, "vite:build"], {
    cwd,
    env: { ...process.env },
  });
};

export const viteRemixServe = async ({
  cwd,
  port,
}: {
  cwd: string;
  port: number;
}) => {
  let nodeBin = process.argv[0];
  let serveProc = spawn(
    nodeBin,
    ["node_modules/@remix-run/serve/dist/cli.js", "build/server/index.js"],
    {
      cwd,
      stdio: "pipe",
      env: { NODE_ENV: "production", PORT: port.toFixed(0) },
    }
  );

  await waitForServer(serveProc, { port });

  return () => {
    serveProc.kill();
  };
};

export const viteDev = createDev([remixBin, "vite:dev"]);
export const customDev = createDev(["./server.mjs"]);

function node(args: string[], options: { cwd: string }) {
  let nodeBin = process.argv[0];

  let proc = spawn(nodeBin, args, {
    cwd: options.cwd,
    env: process.env,
    stdio: "pipe",
  });
  return proc;
}

async function kill(pid: number) {
  if (!isAlive(pid)) return;

  let isWindows = process.platform === "win32";
  if (isWindows) {
    await execa("taskkill", ["/F", "/PID", pid.toString()]).catch((error) => {
      // taskkill 128 -> the process is already dead
      if (error.exitCode === 128) return;
      if (/There is no running instance of the task./.test(error.message))
        return;
      console.warn(error.message);
    });
    return;
  }
  await execa("kill", ["-9", pid.toString()]).catch((error) => {
    // process is already dead
    if (/No such process/.test(error.message)) return;
    console.warn(error.message);
  });
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

async function waitForServer(
  proc: ChildProcess & { stdout: Readable; stderr: Readable },
  args: { port: number }
) {
  let devStdout = bufferize(proc.stdout);
  let devStderr = bufferize(proc.stderr);

  await waitOn({
    resources: [`http://localhost:${args.port}/`],
    timeout: 10000,
  }).catch((err) => {
    let stdout = devStdout();
    let stderr = devStderr();
    kill(proc.pid!);
    throw new Error(
      [
        err.message,
        "",
        "exit code: " + proc.exitCode,
        "stdout: " + stdout ? `\n${stdout}\n` : "<empty>",
        "stderr: " + stderr ? `\n${stderr}\n` : "<empty>",
      ].join("\n")
    );
  });
}

function bufferize(stream: Readable): () => string {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
}

export function createEditor(projectDir: string) {
  return async (file: string, transform: (contents: string) => string) => {
    let filepath = path.join(projectDir, file);
    let contents = await fs.readFile(filepath, "utf8");
    await fs.writeFile(filepath, transform(contents), "utf8");
  };
}

export function grep(cwd: string, pattern: RegExp): string[] {
  let assetFiles = glob.sync("**/*.@(js|jsx|ts|tsx)", {
    cwd,
    absolute: true,
  });

  let lines = shell
    .grep("-l", pattern, assetFiles)
    .stdout.trim()
    .split("\n")
    .filter((line) => line.length > 0);
  return lines;
}

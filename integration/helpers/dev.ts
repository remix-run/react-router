import { spawn } from "node:child_process";
import type { Readable } from "node:stream";
import execa from "execa";
import getPort from "get-port";
import resolveBin from "resolve-bin";
import waitOn from "wait-on";

import { js } from "./create-fixture.js";

const isWindows = process.platform === "win32";

export const basicTemplate = (args: {
  port: number;
  hmrPort: number;
}): Record<string, string> => ({
  "vite.config.ts": js`
    import { defineConfig } from "vite";
    import { unstable_vitePlugin as remix } from "@remix-run/dev";

    export default defineConfig({
      server: {
        hmr: {
          port: ${args.hmrPort}
        }
      },
      plugins: [remix()],
    });
  `,
  "server.mjs": js`
    import {
      unstable_createViteServer,
      unstable_loadViteServerBuild,
    } from "@remix-run/dev";
    import { createRequestHandler } from "@remix-run/express";
    import { installGlobals } from "@remix-run/node";
    import express from "express";

    installGlobals();

    let vite =
      process.env.NODE_ENV === "production"
        ? undefined
        : await unstable_createViteServer();

    const app = express();

    if (vite) {
      app.use(vite.middlewares);
    } else {
      app.use(
        "/build",
        express.static("public/build", { immutable: true, maxAge: "1y" })
      );
    }
    app.use(express.static("public", { maxAge: "1h" }));

    app.all(
      "*",
      createRequestHandler({
        build: vite
          ? () => unstable_loadViteServerBuild(vite)
          : await import("./build/index.js"),
        // load context
      })
    );

    const port = ${args.port};
    app.listen(port, () => console.log('http://localhost:' + port));
  `,
  "app/root.tsx": js`
    import { Links, Meta, Outlet, Scripts, LiveReload } from "@remix-run/react";

    export default function Root() {
      return (
        <html lang="en">
          <head>
            <Meta />
            <Links />
          </head>
          <body>
            <Outlet />
            <Scripts />
            <LiveReload />
          </body>
        </html>
      );
    }
  `,
  "app/routes/_index.tsx": js`
    import type { MetaFunction } from "@remix-run/node";

    export const meta: MetaFunction = () => {
      return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" },
      ];
    };

    export default function Index() {
      return (
        <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
          <h1>Welcome to Remix</h1>
          <ul>
            <li>
              <a
                target="_blank"
                href="https://remix.run/tutorials/blog"
                rel="noreferrer"
              >
                15m Quickstart Blog Tutorial
              </a>
            </li>
            <li>
              <a
                target="_blank"
                href="https://remix.run/tutorials/jokes"
                rel="noreferrer"
              >
                Deep Dive Jokes App Tutorial
              </a>
            </li>
            <li>
              <a target="_blank" href="https://remix.run/docs" rel="noreferrer">
                Remix Docs
              </a>
            </li>
          </ul>
        </div>
      );
    }
  `,
});

export async function viteDev(
  projectDir: string,
  options: { port?: number } = {}
) {
  let viteBin = resolveBin.sync("vite");
  return node(projectDir, [viteBin, "dev"], options);
}

export async function node(
  projectDir: string,
  command: string[],
  options: { port?: number } = {}
) {
  let nodeBin = process.argv[0];
  let proc = spawn(nodeBin, command, {
    cwd: projectDir,
    env: process.env,
    stdio: "pipe",
  });
  let devStdout = bufferize(proc.stdout);
  let devStderr = bufferize(proc.stderr);

  let port = options.port ?? (await getPort());
  await waitOn({
    resources: [`http://localhost:${port}/`],
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

  return { pid: proc.pid!, port: port };
}

export async function kill(pid: number) {
  if (!isAlive(pid)) return;
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

// utils ------------------------------------------------------------

function bufferize(stream: Readable): () => string {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
}

function isAlive(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return false;
  }
}

import { test, expect } from "@playwright/test";
import type { Readable } from "node:stream";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import getPort from "get-port";
import waitOn from "wait-on";

import { createFixtureProject, js } from "./helpers/create-fixture.js";
import { killtree } from "./helpers/killtree.js";

test.describe("Vite custom entry dev", () => {
  let projectDir: string;
  let devProc: ChildProcessWithoutNullStreams;
  let devPort: number;

  test.beforeAll(async () => {
    devPort = await getPort();
    projectDir = await createFixtureProject({
      files: {
        "remix.config.js": js`
          throw new Error("Remix should not access remix.config.js when using Vite");
          export default {};
        `,
        "vite.config.ts": js`
          import { defineConfig } from "vite";
          import { vitePlugin as remix } from "@remix-run/dev";

          export default defineConfig({
            server: {
              port: ${devPort},
              strictPort: true,
            },
            plugins: [
              remix(),
            ],
          });
        `,
        "app/entry.server.tsx": js`
          import { PassThrough } from "node:stream";

          import type { EntryContext } from "@remix-run/node";
          import { createReadableStreamFromReadable } from "@remix-run/node";
          import { RemixServer } from "@remix-run/react";
          import { renderToPipeableStream } from "react-dom/server";

          const ABORT_DELAY = 5_000;

          export default function handleRequest(
            request: Request,
            responseStatusCode: number,
            responseHeaders: Headers,
            remixContext: EntryContext
          ) {
            return new Promise((resolve, reject) => {
              let shellRendered = false;
              const { pipe, abort } = renderToPipeableStream(
                <RemixServer
                  context={remixContext}
                  url={request.url}
                  abortDelay={ABORT_DELAY}
                />,
                {
                  onShellReady() {
                    shellRendered = true;
                    const body = new PassThrough();
                    const stream = createReadableStreamFromReadable(body);

                    responseHeaders.set("Content-Type", "text/html");

                    // Used to test that the request object is an instance of the global Request constructor
                    responseHeaders.set("x-test-request-instanceof-request", String(request instanceof Request));

                    resolve(
                      new Response(stream, {
                        headers: responseHeaders,
                        status: responseStatusCode,
                      })
                    );

                    pipe(body);
                  },
                  onShellError(error: unknown) {
                    reject(error);
                  },
                  onError(error: unknown) {
                    responseStatusCode = 500;
                    // Log streaming rendering errors from inside the shell.  Don't log
                    // errors encountered during initial shell rendering since they'll
                    // reject and get logged in handleDocumentRequest.
                    if (shellRendered) {
                      console.error(error);
                    }
                  },
                }
              );

              setTimeout(abort, ABORT_DELAY);
            });
          }
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
                  <div id="content">
                    <h1>Root</h1>
                    <Outlet />
                  </div>
                  <Scripts />
                  <LiveReload />
                </body>
              </html>
            );
          }
        `,
        "app/routes/_index.tsx": js`
          export default function IndexRoute() {
            return <div>IndexRoute</div>
          }
        `,
      },
    });

    let nodeBin = process.argv[0];
    let remixBin = "node_modules/@remix-run/dev/dist/cli.js";
    devProc = spawn(nodeBin, [remixBin, "vite:dev"], {
      cwd: projectDir,
      env: process.env,
      stdio: "pipe",
    });
    let devStdout = bufferize(devProc.stdout);
    let devStderr = bufferize(devProc.stderr);

    await waitOn({
      resources: [`http://localhost:${devPort}/`],
      timeout: 10000,
    }).catch((err) => {
      let stdout = devStdout();
      let stderr = devStderr();
      throw new Error(
        [
          err.message,
          "",
          "exit code: " + devProc.exitCode,
          "stdout: " + stdout ? `\n${stdout}\n` : "<empty>",
          "stderr: " + stderr ? `\n${stderr}\n` : "<empty>",
        ].join("\n")
      );
    });
  });

  test.afterAll(async () => {
    devProc.pid && (await killtree(devProc.pid));
  });

  // Ensure libraries/consumers can perform an instanceof check on the request
  test("request instanceof Request", async ({ request }) => {
    let res = await request.get(`http://localhost:${devPort}/`);
    expect(res.headers()).toMatchObject({
      "x-test-request-instanceof-request": "true",
    });
  });
});

let bufferize = (stream: Readable): (() => string) => {
  let buffer = "";
  stream.on("data", (data) => (buffer += data.toString()));
  return () => buffer;
};

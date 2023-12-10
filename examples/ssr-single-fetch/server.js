import { Readable } from "node:stream";

import express from "express";
import * as vite from "vite";

const app = express();
const viteServer = await vite.createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

app.use(viteServer.middlewares);

app.use("*", async (req, res) => {
  const { render } = /** @type {import("./app/entry.server.js")} */ (
    await viteServer.ssrLoadModule("/app/entry.server.tsx")
  );

  const url = new URL(req.originalUrl || "/", "http://localhost:3000");

  // TODO: handle headers
  let init = {
    method: req.method,
    body: /** @type {ReadableStream<Uint8Array> | undefined} */ (undefined),
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = /** @type {ReadableStream<Uint8Array> | undefined} */ (
      Readable.toWeb(req)
    );
  }
  const request = new Request(url, init);

  /**
   * @type {Response}
   */
  const response = await render(request, {
    bootstrapModules: [
      "/@vite/client",
      "/@react-refresh",
      "/app/entry.client.tsx",
    ],
    // bootstrapScriptContent: reactPlugin.preambleCode,
  });

  // TODO: handle headers
  res.writeHead(response.status, response.statusText, {});

  if (response.body) {
    Readable.fromWeb(
      /** @type {import("node:stream/web").ReadableStream} */ (response.body)
    ).pipe(res, {
      end: true,
    });
  } else {
    res.end();
  }
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});

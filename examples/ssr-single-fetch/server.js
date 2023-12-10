import { Readable } from "node:stream";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
// import express from "express";
import * as vite from "vite";

const app = new Hono();
const viteServer = await vite.createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

// app.use(viteServer.middlewares);
app.use("*", async (c, next) => {
  try {
    const result = await viteServer.transformRequest(
      new URL(c.req.url).pathname,
      { ssr: false }
    );
    if (result) {
      return new Response(result.code, {
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      });
    }
  } catch {}

  await next();
});

app.all("*", async (c) => {
  const { render } = /** @type {import("./app/entry.server.js")} */ (
    await viteServer.ssrLoadModule("/app/entry.server.tsx")
  );

  /**
   * @type {Response}
   */
  return await render(c.req.raw, {
    bootstrapModules: [
      "/@vite/client",
      "/@react-refresh",
      "/app/entry.client.tsx",
    ],
    // bootstrapScriptContent: reactPlugin.preambleCode,
  });
});

serve({ ...app, port: 3000 }, () => {
  console.log("http://localhost:3000");
});

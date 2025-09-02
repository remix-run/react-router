import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then(({ createServer }) =>
        createServer({
          server: {
            middlewareMode: true,
          },
        }),
      );

const requestListener = viteDevServer
  ? async (req, res) => {
      // In dev mode, ensure we load a fresh request handler every request
      const rscEntry = await viteDevServer.environments.rsc.runner.import(
        "virtual:react-router/unstable_rsc/rsc-entry",
      );
      return createRequestListener(rscEntry.default)(req, res);
    }
  : // In production, get the static request handler from the build output
    createRequestListener((await import("./build/server/index.js")).default);

const app = express();

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("build/client"));
}

app.all("*", requestListener);

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Server listening on port ${port} (http://localhost:${port})`);

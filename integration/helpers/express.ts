import tsx from "dedent";

export function server() {
  return tsx`
    import { createRequestHandler } from "@react-router/express";
    import express from "express";

    const port = process.env.PORT ?? 3000
    const hmrPort = process.env.HMR_PORT ?? 3001

    const app = express();

    const getLoadContext = () => ({});

    if (process.env.NODE_ENV === "production") {
      app.use(
        "/assets",
        express.static("build/client/assets", { immutable: true, maxAge: "1y" })
      );
      app.use(express.static("build/client", { maxAge: "1h" }));
      app.all("*", createRequestHandler({
        build: await import("./build/index.js"),
        getLoadContext,
      }));
    } else {
      const viteDevServer = await import("vite").then(
        (vite) => vite.createServer({
          server: {
            middlewareMode: true,
            hmr: { port: hmrPort },
          },
        })
      );
      app.use(viteDevServer.middlewares);
      app.all("*", createRequestHandler({
        build:() => viteDevServer.ssrLoadModule("virtual:react-router/server-build"),
        getLoadContext,
      }));
    }

    app.listen(port, () => console.log('http://localhost:' + port));
  `;
}

export function rsc() {
  return tsx`
    import { createRequestListener } from "@mjackson/node-fetch-server";
    import express from "express";

    const port = process.env.PORT ?? 3000
    const hmrPort = process.env.HMR_PORT ?? 3001

    const app = express();

    if (process.env.NODE_ENV === "production") {
      app.use(
        "/assets",
        express.static("build/client/assets", { immutable: true, maxAge: "1y" })
      );
      app.all("*", createRequestListener((await import("./build/server/index.js")).default.fetch));
    } else {
      const viteDevServer = await import("vite").then(
        (vite) => vite.createServer({
          server: {
            middlewareMode: true,
            hmr: { port: hmrPort },
          },
        })
      );
      app.use(viteDevServer.middlewares);
    }

    app.listen(port, () => console.log('http://localhost:' + port));
  `;
}

import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({ server: { middlewareMode: true } }),
      );

const reactRouterHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
    : await import("./build/server/index.js"),
});

const app = express();
app.use(compression());
app.disable("x-powered-by");
app.use(morgan("tiny"));

// Only intercept incremental discovery. Keep the real versioned manifest asset
// available so loadAllRoutes() can recover without needing a second build.
app.get("/__manifest", async (req, res, next) => {
  let cookies = (req.headers.cookie || "").split(/;\s*/);
  if (cookies.includes("discovery-delay=1")) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  res.set("Cache-Control", "no-store");
  if (cookies.includes("discovery-mismatch=1")) {
    res.set("X-Remix-Reload-Document", "true").status(204).end();
    return;
  }
  next();
});

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" }),
  );
}
app.use(express.static("build/client", { maxAge: "1h" }));
app.all("*", reactRouterHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Route discovery playground: http://localhost:${port}/a`),
);

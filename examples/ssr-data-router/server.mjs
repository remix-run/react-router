import * as path from "path";
import * as fsp from "fs/promises";
import express from "express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// Polyfill Web Fetch API
installGlobals();

let root = process.cwd();
let isProduction = process.env.NODE_ENV === "production";

function resolve(p) {
  return path.resolve(__dirname, p);
}

async function createServer() {
  let app = express();
  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite;

  if (!isProduction) {
    let mod = await import("vite");
    vite = await mod.createServer({
      root,
      server: { middlewareMode: "ssr" },
    });

    app.use(vite.middlewares);
  } else {
    app.use(compression());
    app.use(express.static(resolve("dist/client")));
  }

  let render;
  let template;

  if (isProduction) {
    template = await fsp.readFile(resolve("dist/client/index.html"), "utf8");
    render = (await import("./dist/server/entry.server.mjs")).render;
  }

  app.use("*", async (req, res) => {
    let url = req.originalUrl;

    try {
      if (!isProduction) {
        console.log("dev!");
        template = await fsp.readFile(resolve("index.html"), "utf8");
        template = await vite.transformIndexHtml(url, template);
        render = await vite
          .ssrLoadModule("src/entry.server.tsx")
          .then((m) => m.render);
      }

      try {
        let appHtml = await render(req);
        let html = template.replace("<!--app-html-->", appHtml);
        res.setHeader("Content-Type", "text/html");
        return res.status(200).end(html);
      } catch (e) {
        if (e instanceof Response && e.status >= 300 && e.status <= 399) {
          return res.redirect(e.status, e.headers.get("Location"));
        }
        throw e;
      }
    } catch (error) {
      if (!isProduction) {
        vite.ssrFixStacktrace(error);
      }
      console.log(error.stack);
      res.status(500).end(error.stack);
    }
  });

  return app;
}

createServer().then((app) => {
  app.listen(3000, () => {
    console.log("HTTP server is running at http://localhost:3000");
  });
});

let path = require("path");
let fsp = require("fs/promises");
let express = require("express");

let isProduction = process.env.NODE_ENV === "production";

async function createServer() {
  let app = express();
  /**
   * @type {import("vite").ViteDevServer}
   */
  let vite;

  if (!isProduction) {
    vite = await require("vite").createServer({
      root: process.cwd(),
      server: { middlewareMode: "ssr" }
    });

    app.use(vite.middlewares);
  } else {
    app.use(require("compression")());
    app.use(express.static(path.join(__dirname, "dist/home/client")));
    app.use(express.static(path.join(__dirname, "dist/inbox/client")));
  }

  app.use("*", async (req, res) => {
    let url = req.originalUrl;
    let template;
    let render;

    let htmlFileToLoad = url.startsWith("/inbox")
      ? isProduction
        ? "inbox/client/index.html"
        : "inbox/index.html"
      : isProduction
      ? "home/client/index.html"
      : "index.html";

    let appDirectory = url.startsWith("/inbox") ? "inbox" : "home";

    try {
      if (!isProduction) {
        template = await fsp.readFile(
          path.resolve(__dirname, htmlFileToLoad),
          "utf8"
        );
        template = await vite.transformIndexHtml(url, template);
        render = await vite
          .ssrLoadModule(
            path.resolve(__dirname, appDirectory, "entry.server.jsx")
          )
          .then(m => m.render);
      } else {
        template = await fsp.readFile(
          path.resolve(__dirname, "dist", htmlFileToLoad),
          "utf8"
        );
        render = require(path.resolve(
          __dirname,
          "dist",
          appDirectory,
          "server",
          "entry.server.js"
        )).render;
      }

      let appHTML = await render(url);

      let html = template.replace("<!--ssr-outlet-->", appHTML);
      res.setHeader("Content-Type", "text/html");
      return res.status(200).end(html);
    } catch (error) {
      if (!isProduction) {
        vite.ssrFixStacktrace(error);
      }
      console.log(error.stack);
      return res.status(500).end(error.stack);
    }
  });

  return app;
}

createServer().then(app => {
  app.listen(3000, () => {
    console.log("HTTP server is running at http://localhost:3000");
  });
});

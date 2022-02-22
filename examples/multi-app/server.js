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
      server: { middlewareMode: "ssr" },
    });

    app.use(vite.middlewares);
  } else {
    app.use(require("compression")());
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.use("*", async (req, res) => {
    let url = req.originalUrl;

    // Use a separate HTML file for the "Inbox" app.
    let appDirectory = url.startsWith("/inbox") ? "inbox" : "";
    let htmlFileToLoad;

    if (isProduction) {
      htmlFileToLoad = path.join("dist", appDirectory, "index.html");
    } else {
      htmlFileToLoad = path.join(appDirectory, "index.html");
    }

    try {
      let html = await fsp.readFile(
        path.join(__dirname, htmlFileToLoad),
        "utf8"
      );

      if (!isProduction) {
        html = await vite.transformIndexHtml(req.url, html);
      }

      res.setHeader("Content-Type", "text/html");
      return res.status(200).end(html);
    } catch (error) {
      if (!isProduction) vite.ssrFixStacktrace(error);
      console.log(error.stack);
      return res.status(500).end(error.stack);
    }
  });

  return app;
}

createServer().then((app) => {
  app.listen(3000, () => {
    console.log("HTTP server is running at http://localhost:3000");
  });
});

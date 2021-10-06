let fs = require("fs/promises");
let path = require("path");

let express = require("express");

let { PORT = 3000 } = process.env;
let isProduction = process.env.NODE_ENV === "production";

async function createServer() {
  let app = express();

  let vite;

  if (isProduction) {
    app.use(express.static(resolve("public")));
  } else {
    let _vite = require("vite");
    vite = await _vite.createServer({ server: { middlewareMode: "ssr" } });
    app.use(vite.middlewares);
  }

  app.use("/profile", async (req, res) => {
    return renderApp("profile", vite, req, res);
  });

  app.use("/feed", async (req, res) => {
    return renderApp("feed", vite, req, res);
  });

  return app;
}

createServer().then(app => {
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
});

///////////////////////////////////////////////////////////////////////////

function resolve(file) {
  return path.resolve(__dirname, file);
}

async function renderApp(app, vite, req, res) {
  let url = req.originalUrl;

  try {
    /* 1. Read index.html */
    let template = await fs.readFile(resolve(`${app}.html`), "utf-8");
    /*
      2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      also applies HTML transforms from Vite plugins, e.g. global preambles
      from @vitejs/plugin-react-refresh
    */
    template = await vite.transformIndexHtml(url, template);

    /*
      3. Load the server entry. vite.ssrLoadModule automatically transforms
      your ESM source code to be usable in Node.js! There is no bundling
      required, and provides efficient invalidation similar to HMR.
    */
    const { render } = await vite.ssrLoadModule(`${app}/entry.server.jsx`);

    /*
      4. render the app HTML. This assumes entry-server.js's exported `render`
      function calls appropriate framework SSR APIs,
      e.g. ReactDOMServer.renderToString()
    */
    const appHtml = await render(url);

    /* 5. Inject the app-rendered HTML into the template. */
    const html = template.replace(`<!--ssr-outlet-->`, appHtml);

    /* 6. Send the rendered HTML back. */
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (error) {
    /*
      If an error is caught, let Vite fix the stracktrace so it maps back to
      your actual source code.
    */
    vite.ssrFixStacktrace(error);
    console.error(error);
    res.status(500).end(error.message);
  }
}

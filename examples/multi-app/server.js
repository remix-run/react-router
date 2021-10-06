let path = require("path");

let express = require("express");
let { createServer: createViteServer } = require("vite");

function resolve(p) {
  return path.resolve(__dirname, p);
}

async function createServer() {
  let app = express();

  // Create Vite server in middleware mode.
  const vite = await createViteServer({
    server: { middlewareMode: "ssr" }
  });
  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  app.use(express.static("public"));

  app.get("/", (req, res) => {
    res.sendFile(resolve("public/index.html"));
  });

  app.use("/dashboard", (req, res) => {
    return res.sendFile(resolve("public/build/dashboard/index.html"));
  });

  app.use("/feed", (req, res) => {
    return res.sendFile(resolve("public/build/feed/index.html"));
  });

  app.use("*", (req, res) => {
    res.status(404).send("404");
  });

  return app;
}

createServer().then(app => {
  app.listen(3000, () => {
    console.log("http://localhost:3000");
  });
});

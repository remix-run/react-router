const { createRequestListener } = require("@mjackson/node-fetch-server");
const express = require("express");
const reactRouterRequestHandler = require("./build/server/index.js").default;

const app = express();

app.use(express.static("public"));
app.use("/client", express.static("dist/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(404);
  res.send("Not Found");
});

app.use(createRequestListener(reactRouterRequestHandler));

app.listen(3000);
console.log("Server listening on port 3000 (http://localhost:3000)");

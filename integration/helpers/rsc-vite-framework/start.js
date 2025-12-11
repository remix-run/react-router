import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import build from "./build/server/index.js";

const app = express();

app.use(process.env.VITE_BASE || "/", express.static("build/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(404);
  res.send("Not Found");
});

app.use(createRequestListener(build.fetch));

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Server listening on port ${port} (http://localhost:${port})`);

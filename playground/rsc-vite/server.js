import { parseArgs } from "node:util";
import { createRequestListener } from "@remix-run/node-fetch-server";
import compression from "compression";
import express from "express";

import rscRequestHandler from "./dist/rsc/index.js";

const app = express();

app.use(compression());
app.use(express.static("dist/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(404);
  res.end();
});

app.use(createRequestListener(rscRequestHandler));

const { values } = parseArgs({
  options: { p: { type: "string", default: "3000" } },
  allowPositionals: true,
});

const port = parseInt(values.p, 10);
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

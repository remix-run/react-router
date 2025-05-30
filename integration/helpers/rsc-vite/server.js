import { parseArgs } from "node:util";
import { createRequestListener } from "@mjackson/node-fetch-server";
import compression from "compression";
import express from "express";

import ssr from "./dist/ssr/entry.ssr.js";
import server from "./dist/server/entry.rsc.js";

const app = express();

app.use(compression());
app.use(express.static("dist/client"));

app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.status(404);
  res.end();
});

app.use(
  createRequestListener((request) => {
    return ssr.fetch(request, {
      SERVER: {
        fetch(request) {
          return server.fetch(request);
        },
      },
    });
  })
);

const { values } = parseArgs({
  options: { p: { type: "string", default: "3000" } },
  allowPositionals: true,
});

const port = parseInt(values.p, 10);
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

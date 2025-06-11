import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import reactRouterRequestHandler from "./entry.request-handler.ts";

function createExpressApp({ distDir = "dist" }: { distDir?: string } = {}) {
  const app = express();

  app.use("/client", express.static(`${distDir}/client`));

  app.use(createRequestListener(reactRouterRequestHandler));

  return app;
}

export default createExpressApp;

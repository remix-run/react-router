import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";

export function createApp(
  buildPath: string,
  mode = "production",
  publicPath = "/build/",
  assetsBuildDirectory = "public/build/"
) {
  let app = express();

  app.disable("x-powered-by");

  app.use(compression());

  app.use(
    publicPath,
    express.static(assetsBuildDirectory, { immutable: true, maxAge: "1y" })
  );

  app.use(express.static("public", { maxAge: "1h" }));

  app.use(morgan("tiny"));

  let requestHandler: ReturnType<typeof createRequestHandler> | undefined;
  app.all("*", async (req, res, next) => {
    try {
      if (!requestHandler) {
        let build = await import(buildPath);
        requestHandler = createRequestHandler({ build, mode });
      }

      return await requestHandler(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  return app;
}

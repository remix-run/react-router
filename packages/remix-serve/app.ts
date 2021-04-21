import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";

export default function getApp(buildPath: string) {
  let app = express();

  app.use(compression());

  app.use(
    express.static("public", {
      immutable: true,
      maxAge: "1y"
    })
  );

  app.use(morgan("tiny"));

  app.all(
    "*",
    process.env.NODE_ENV === "production"
      ? createRequestHandler({
          build: require(buildPath)
        })
      : (req, res, next) => {
          // require cache is purged in @remix-run/dev where the file watcher is
          return createRequestHandler({
            build: require(buildPath)
          })(req, res, next);
        }
  );

  return app;
}

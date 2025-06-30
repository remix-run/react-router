import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import "react-router";
import { expressContext } from "~/contexts";

export const app = express();
app.use(compression());
app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
  app.use(express.static("build/client", { maxAge: "1h" }));
}

app.use(morgan("tiny"));
app.use(
  createRequestHandler({
    // @ts-expect-error
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      return new Map([[expressContext, "Hello from Express"]]);
    },
  })
);

if (process.env.NODE_ENV === "production") {
  console.log("Starting production server");
  const PORT = Number.parseInt(process.env.PORT || "3000");
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

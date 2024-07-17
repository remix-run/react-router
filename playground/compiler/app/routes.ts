import { defineRoutes, configRoutes, fileRoutes } from "@react-router/dev";

export default defineRoutes(
  configRoutes((r) => [r.index("routes/_index.tsx")]),
  fileRoutes({ rootDirectory: "fs-routes" })
);

import { defineRoutes, dataRoutes, fsRoutes } from "@react-router/dev";

export default defineRoutes([
  dataRoutes((r) => [r.index("routes/_index.tsx")]),
  fsRoutes({
    rootDirectory: "fs-routes",
  }),
]);

import { defineRoutes, dataRoutes, fsRoutes } from "@react-router/dev";

export default defineRoutes([
  dataRoutes([
    {
      index: true,
      file: "routes/_index.tsx",
    },
  ]),
  fsRoutes({
    rootDirectory: "fs-routes",
  }),
]);

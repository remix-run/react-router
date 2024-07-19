import { defineRoutes } from "@react-router/dev";
import { remixRoutes } from "@react-router/remix-v2-routes";

export default [
  defineRoutes((r) => {
    return [r.index("routes/_index.tsx")];
  }),
  remixRoutes({
    rootDirectory: "remix-routes",
  }),
];

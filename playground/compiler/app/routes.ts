import { defineRoutes, route } from "@react-router/dev/config";
import { remixRoutes } from "@react-router/remix-v2-routes";

export default [
  defineRoutes([route.index("routes/_index.tsx")]),
  remixRoutes({ rootDirectory: "remix-routes" }),
];

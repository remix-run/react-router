import { routes, index, type RoutesConfig } from "@react-router/dev/routes";
import { remixRoutes } from "@react-router/remix-v2-routes";

export default [
  routes([index("routes/_index.tsx")]),
  await remixRoutes({ rootDirectory: "remix-routes" }),
] satisfies RoutesConfig;

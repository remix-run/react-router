import { defineRoutes, index } from "@react-router/dev/routes";
import { remixRoutes } from "@react-router/remix-v2-routes";

export default defineRoutes([
  ...(await remixRoutes({ rootDirectory: "remix-routes" })),

  index("routes/_index.tsx"),
]);

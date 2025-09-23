import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route(":slug", "routes/slug.tsx"),
] satisfies RouteConfig;

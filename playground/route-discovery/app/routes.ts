import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("a", "routes/a.tsx"),
  route("b", "routes/b.tsx"),
] satisfies RouteConfig;

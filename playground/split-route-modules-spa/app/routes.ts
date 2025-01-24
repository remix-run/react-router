import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("splittable", "routes/splittable.tsx"),
  route("unsplittable", "routes/unsplittable.tsx"),
  route("semi-splittable", "routes/semi-splittable.tsx"),
] satisfies RouteConfig;

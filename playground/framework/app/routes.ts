import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("products/:id", "routes/product.tsx"),
  route("layout-suspense", "routes/layout-suspense.tsx", [
    route("child","routes/layout-child.tsx")
  ]),
] satisfies RouteConfig;

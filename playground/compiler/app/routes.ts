import { type RouteConfig, index, route } from "@react-router/dev/routes";

export const routes: RouteConfig = [
  index("routes/_index.tsx"),
  route("products/:id", "routes/product.tsx"),
];

import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Define the routes array
const routes = [
  index("routes/_index.tsx"),
  route("products/:id", "routes/product.tsx"),
  // Add the wildcard route at the end to avoid unexpected matching
  route("*", "routes/404.tsx"),
];

// Ensure wildcard route is placed last
if (routes.length > 1) {
  for (let i = 0; i < routes.length - 1; i++) {
    if (routes[i].path === "*") {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          'Warning: Your wildcard route (path="*") should be placed after all other routes to avoid unexpected matching.'
        );
      }
      break;
    }
  }
}

export default routes satisfies RouteConfig;

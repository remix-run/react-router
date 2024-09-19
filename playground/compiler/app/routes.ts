import { type RouteConfig, index, route } from "@react-router/dev/routes";

export const routes: RouteConfig = [
  index("routes/_index.tsx"),
  route("marketing/:id?", "routes/marketing.tsx", [
    route("another/:id?", "routes/another.tsx"),
    route("blah/:blah", "routes/blah.tsx"),
  ])
];

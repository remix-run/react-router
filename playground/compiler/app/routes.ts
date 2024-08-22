import { type RoutesConfig, route, index } from "@react-router/dev/routes";

export const routes: RoutesConfig = [
  index("routes/_index.tsx"),
  route("/chunkable", "routes/chunkable/route.tsx"),
  route("/unchunkable", "routes/unchunkable.tsx"),
];

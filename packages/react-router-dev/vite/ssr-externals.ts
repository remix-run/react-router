import { isReactRouterRepo } from "../config/is-react-router-repo";

export const ssrExternals = isReactRouterRepo()
  ? [
      // This is only needed within this repo because these packages
      // are linked to a directory outside of node_modules so Vite
      // treats them as internal code by default.
      "react-router",
      "react-router-dom",
      "@react-router/architect",
      "@react-router/cloudflare",
      "@react-router/dev",
      "@react-router/express",
      "@react-router/node",
      "@react-router/serve",
    ]
  : undefined;

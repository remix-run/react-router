declare module "virtual:react-router/unstable_rsc/routes" {
  import type { unstable_RSCRouteConfig as RSCRouteConfig } from "react-router";

  const routes: RSCRouteConfig;
  export default routes;
}

declare module "virtual:react-router/unstable_rsc/basename" {
  const basename: string;
  export default basename;
}

declare module "virtual:react-router/unstable_rsc/react-router-serve-config" {
  const unstable_reactRouterServeConfig: {
    publicPath: string;
    assetsBuildDirectory: string;
  };
  export default unstable_reactRouterServeConfig;
}

declare module "virtual:react-router/unstable_rsc/inject-hmr-runtime" {}

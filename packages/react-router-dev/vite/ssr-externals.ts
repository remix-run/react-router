import path from "node:path";

function isInReactRouterMonorepo() {
  // We use '@react-router/node' for this check since it's a
  // dependency of this package and guaranteed to be in node_modules
  let serverRuntimePath = path.dirname(
    require.resolve("@react-router/node/package.json")
  );
  let serverRuntimeParentDir = path.basename(
    path.resolve(serverRuntimePath, "..")
  );
  return serverRuntimeParentDir === "packages";
}

export let ssrExternals = isInReactRouterMonorepo()
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

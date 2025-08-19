import * as React from "react";

import { BoundaryShell } from "./errorBoundaries";
import { ENABLE_DEV_WARNINGS } from "../../context";

// If the user sets `clientLoader.hydrate=true` somewhere but does not
// provide a `HydrateFallback` at any level of the tree, then we need to at
// least include `<Scripts>` in the SSR so we can hydrate the app and call the
// `clientLoader` functions
export function RemixRootDefaultHydrateFallback() {
  return (
    <BoundaryShell title="Loading..." renderScripts>
      {ENABLE_DEV_WARNINGS ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log(
                "💿 Hey developer 👋. You can provide a way better UX than this " +
                "when your app is loading JS modules and/or running \`clientLoader\` " +
                "functions. Check out https://reactrouter.com/start/framework/route-module#hydratefallback " +
                "for more information."
              );
            `,
          }}
        />
      ) : null}
    </BoundaryShell>
  );
}

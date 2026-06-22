/**
 * react-router v8.0.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { BoundaryShell } from "./errorBoundaries.js";
import { useFrameworkContext } from "./components.js";
import * as React$1 from "react";
//#region lib/dom/ssr/fallback.tsx
function RemixRootDefaultHydrateFallback() {
	let { nonce } = useFrameworkContext();
	return /* @__PURE__ */ React$1.createElement(BoundaryShell, {
		title: "Loading...",
		renderScripts: true
	}, /* @__PURE__ */ React$1.createElement("script", {
		nonce,
		dangerouslySetInnerHTML: { __html: `
              console.log(
                "💿 Hey developer 👋. You can provide a way better UX than this " +
                "when your app is loading JS modules and/or running \`clientLoader\` " +
                "functions. Check out https://reactrouter.com/start/framework/route-module#hydratefallback " +
                "for more information."
              );
            ` }
	}));
}
//#endregion
export { RemixRootDefaultHydrateFallback };

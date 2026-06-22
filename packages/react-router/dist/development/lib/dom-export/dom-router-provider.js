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
import * as React$1 from "react";
import * as ReactDOM from "react-dom";
import { RouterProvider } from "react-router";
//#region lib/dom-export/dom-router-provider.tsx
function RouterProvider$1(props) {
	return /* @__PURE__ */ React$1.createElement(RouterProvider, {
		flushSync: ReactDOM.flushSync,
		...props
	});
}
//#endregion
export { RouterProvider$1 as RouterProvider };

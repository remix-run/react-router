/**
 * react-router v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use client";
import { RouterProvider } from "./lib/dom-export/dom-router-provider.js";
import { HydratedRouter } from "./lib/dom-export/hydrated-router.js";
import { RSCHydratedRouter, createCallServer } from "./lib/rsc/browser.js";
import { getRSCStream } from "./lib/rsc/html-stream/browser.js";
//#region dom-export.ts
/**
* @module dom
*/
//#endregion
export { HydratedRouter, RouterProvider, RSCHydratedRouter as unstable_RSCHydratedRouter, createCallServer as unstable_createCallServer, getRSCStream as unstable_getRSCStream };

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
import { isRouteErrorResponse } from "../../router/utils.js";
import { Scripts, useFrameworkContext } from "./components.js";
import * as React$1 from "react";
//#region lib/dom/ssr/errorBoundaries.tsx
var RemixErrorBoundary = class extends React$1.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: props.error || null,
			location: props.location
		};
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	static getDerivedStateFromProps(props, state) {
		if (state.location !== props.location) return {
			error: props.error || null,
			location: props.location
		};
		return {
			error: props.error || state.error,
			location: state.location
		};
	}
	render() {
		if (this.state.error) return /* @__PURE__ */ React$1.createElement(RemixRootDefaultErrorBoundary, {
			error: this.state.error,
			isOutsideRemixApp: true
		});
		else return this.props.children;
	}
};
/**
* When app's don't provide a root level ErrorBoundary, we default to this.
*/
function RemixRootDefaultErrorBoundary({ error, isOutsideRemixApp }) {
	let { nonce } = useFrameworkContext();
	console.error(error);
	let heyDeveloper = /* @__PURE__ */ React$1.createElement("script", {
		nonce,
		dangerouslySetInnerHTML: { __html: `
        console.log(
          "💿 Hey developer 👋. You can provide a way better UX than this when your app throws errors. Check out https://reactrouter.com/how-to/error-boundary for more information."
        );
      ` }
	});
	if (isRouteErrorResponse(error)) return /* @__PURE__ */ React$1.createElement(BoundaryShell, { title: "Unhandled Thrown Response!" }, /* @__PURE__ */ React$1.createElement("h1", { style: { fontSize: "24px" } }, error.status, " ", error.statusText), null);
	let errorInstance;
	if (error instanceof Error) errorInstance = error;
	else {
		let errorString = error == null ? "Unknown Error" : typeof error === "object" && "toString" in error ? error.toString() : JSON.stringify(error);
		errorInstance = new Error(errorString);
	}
	return /* @__PURE__ */ React$1.createElement(BoundaryShell, {
		title: "Application Error!",
		isOutsideRemixApp
	}, /* @__PURE__ */ React$1.createElement("h1", { style: { fontSize: "24px" } }, "Application Error"), /* @__PURE__ */ React$1.createElement("pre", { style: {
		padding: "2rem",
		background: "hsla(10, 50%, 50%, 0.1)",
		color: "red",
		overflow: "auto"
	} }, errorInstance.stack), heyDeveloper);
}
function BoundaryShell({ title, renderScripts, isOutsideRemixApp, children }) {
	let { routeModules } = useFrameworkContext();
	if (routeModules.root?.Layout && !isOutsideRemixApp) return children;
	return /* @__PURE__ */ React$1.createElement("html", { lang: "en" }, /* @__PURE__ */ React$1.createElement("head", null, /* @__PURE__ */ React$1.createElement("meta", { charSet: "utf-8" }), /* @__PURE__ */ React$1.createElement("meta", {
		name: "viewport",
		content: "width=device-width,initial-scale=1,viewport-fit=cover"
	}), /* @__PURE__ */ React$1.createElement("title", null, title)), /* @__PURE__ */ React$1.createElement("body", null, /* @__PURE__ */ React$1.createElement("main", { style: {
		fontFamily: "system-ui, sans-serif",
		padding: "2rem"
	} }, children, renderScripts ? /* @__PURE__ */ React$1.createElement(Scripts, null) : null)));
}
//#endregion
export { BoundaryShell, RemixErrorBoundary, RemixRootDefaultErrorBoundary };

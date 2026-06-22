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
import { isRouteErrorResponse } from "../router/utils.js";
import { useRouteError } from "../hooks.js";
import React from "react";
//#region lib/rsc/errorBoundaries.tsx
var RSCRouterGlobalErrorBoundary = class extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			error: null,
			location: props.location
		};
	}
	static getDerivedStateFromError(error) {
		return { error };
	}
	static getDerivedStateFromProps(props, state) {
		if (state.location !== props.location) return {
			error: null,
			location: props.location
		};
		return {
			error: state.error,
			location: state.location
		};
	}
	render() {
		if (this.state.error) return /* @__PURE__ */ React.createElement(RSCDefaultRootErrorBoundaryImpl, {
			error: this.state.error,
			renderAppShell: true
		});
		else return this.props.children;
	}
};
function ErrorWrapper({ renderAppShell, title, children }) {
	if (!renderAppShell) return children;
	return /* @__PURE__ */ React.createElement("html", { lang: "en" }, /* @__PURE__ */ React.createElement("head", null, /* @__PURE__ */ React.createElement("meta", { charSet: "utf-8" }), /* @__PURE__ */ React.createElement("meta", {
		name: "viewport",
		content: "width=device-width,initial-scale=1,viewport-fit=cover"
	}), /* @__PURE__ */ React.createElement("title", null, title)), /* @__PURE__ */ React.createElement("body", null, /* @__PURE__ */ React.createElement("main", { style: {
		fontFamily: "system-ui, sans-serif",
		padding: "2rem"
	} }, children)));
}
function RSCDefaultRootErrorBoundaryImpl({ error, renderAppShell }) {
	console.error(error);
	let heyDeveloper = /* @__PURE__ */ React.createElement("script", { dangerouslySetInnerHTML: { __html: `
        console.log(
          "💿 Hey developer 👋. You can provide a way better UX than this when your app throws errors. Check out https://reactrouter.com/how-to/error-boundary for more information."
        );
      ` } });
	if (isRouteErrorResponse(error)) return /* @__PURE__ */ React.createElement(ErrorWrapper, {
		renderAppShell,
		title: "Unhandled Thrown Response!"
	}, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: "24px" } }, error.status, " ", error.statusText), null);
	let errorInstance;
	if (error instanceof Error) errorInstance = error;
	else {
		let errorString = error == null ? "Unknown Error" : typeof error === "object" && "toString" in error ? error.toString() : JSON.stringify(error);
		errorInstance = new Error(errorString);
	}
	return /* @__PURE__ */ React.createElement(ErrorWrapper, {
		renderAppShell,
		title: "Application Error!"
	}, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: "24px" } }, "Application Error"), /* @__PURE__ */ React.createElement("pre", { style: {
		padding: "2rem",
		background: "hsla(10, 50%, 50%, 0.1)",
		color: "red",
		overflow: "auto"
	} }, errorInstance.stack), heyDeveloper);
}
function RSCDefaultRootErrorBoundary({ hasRootLayout }) {
	let error = useRouteError();
	if (hasRootLayout === void 0) throw new Error("Missing 'hasRootLayout' prop");
	return /* @__PURE__ */ React.createElement(RSCDefaultRootErrorBoundaryImpl, {
		renderAppShell: !hasRootLayout,
		error
	});
}
//#endregion
export { RSCDefaultRootErrorBoundary, RSCRouterGlobalErrorBoundary };

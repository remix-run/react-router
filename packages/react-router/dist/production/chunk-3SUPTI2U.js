"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }/**
 * react-router v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */






var _chunkUVEQGZIHjs = require('./chunk-UVEQGZIH.js');

// lib/dom/ssr/hydration.tsx
function getHydrationData({
  state,
  routes,
  getRouteInfo,
  location,
  basename,
  isSpaMode
}) {
  let hydrationData = {
    ...state,
    loaderData: { ...state.loaderData }
  };
  let initialMatches = _chunkUVEQGZIHjs.matchRoutes.call(void 0, routes, location, basename);
  if (initialMatches) {
    for (let match of initialMatches) {
      let routeId = match.route.id;
      let routeInfo = getRouteInfo(routeId);
      if (_chunkUVEQGZIHjs.shouldHydrateRouteLoader.call(void 0, 
        routeId,
        routeInfo.clientLoader,
        routeInfo.hasLoader,
        isSpaMode
      ) && (routeInfo.hasHydrateFallback || !routeInfo.hasLoader)) {
        delete hydrationData.loaderData[routeId];
      } else if (!routeInfo.hasLoader) {
        hydrationData.loaderData[routeId] = null;
      }
    }
  }
  return hydrationData;
}

// lib/rsc/errorBoundaries.tsx
var _react = require('react'); var _react2 = _interopRequireDefault(_react);
var RSCRouterGlobalErrorBoundary = class extends _react2.default.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, location: props.location };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  static getDerivedStateFromProps(props, state) {
    if (state.location !== props.location) {
      return { error: null, location: props.location };
    }
    return { error: state.error, location: state.location };
  }
  render() {
    if (this.state.error) {
      return /* @__PURE__ */ _react2.default.createElement(
        RSCDefaultRootErrorBoundaryImpl,
        {
          error: this.state.error,
          renderAppShell: true
        }
      );
    } else {
      return this.props.children;
    }
  }
};
function ErrorWrapper({
  renderAppShell,
  title,
  children
}) {
  if (!renderAppShell) {
    return children;
  }
  return /* @__PURE__ */ _react2.default.createElement("html", { lang: "en" }, /* @__PURE__ */ _react2.default.createElement("head", null, /* @__PURE__ */ _react2.default.createElement("meta", { charSet: "utf-8" }), /* @__PURE__ */ _react2.default.createElement(
    "meta",
    {
      name: "viewport",
      content: "width=device-width,initial-scale=1,viewport-fit=cover"
    }
  ), /* @__PURE__ */ _react2.default.createElement("title", null, title)), /* @__PURE__ */ _react2.default.createElement("body", null, /* @__PURE__ */ _react2.default.createElement("main", { style: { fontFamily: "system-ui, sans-serif", padding: "2rem" } }, children)));
}
function RSCDefaultRootErrorBoundaryImpl({
  error,
  renderAppShell
}) {
  console.error(error);
  let heyDeveloper = /* @__PURE__ */ _react2.default.createElement(
    "script",
    {
      dangerouslySetInnerHTML: {
        __html: `
        console.log(
          "\u{1F4BF} Hey developer \u{1F44B}. You can provide a way better UX than this when your app throws errors. Check out https://reactrouter.com/how-to/error-boundary for more information."
        );
      `
      }
    }
  );
  if (_chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, error)) {
    return /* @__PURE__ */ _react2.default.createElement(
      ErrorWrapper,
      {
        renderAppShell,
        title: "Unhandled Thrown Response!"
      },
      /* @__PURE__ */ _react2.default.createElement("h1", { style: { fontSize: "24px" } }, error.status, " ", error.statusText),
      _chunkUVEQGZIHjs.ENABLE_DEV_WARNINGS ? heyDeveloper : null
    );
  }
  let errorInstance;
  if (error instanceof Error) {
    errorInstance = error;
  } else {
    let errorString = error == null ? "Unknown Error" : typeof error === "object" && "toString" in error ? error.toString() : JSON.stringify(error);
    errorInstance = new Error(errorString);
  }
  return /* @__PURE__ */ _react2.default.createElement(ErrorWrapper, { renderAppShell, title: "Application Error!" }, /* @__PURE__ */ _react2.default.createElement("h1", { style: { fontSize: "24px" } }, "Application Error"), /* @__PURE__ */ _react2.default.createElement(
    "pre",
    {
      style: {
        padding: "2rem",
        background: "hsla(10, 50%, 50%, 0.1)",
        color: "red",
        overflow: "auto"
      }
    },
    errorInstance.stack
  ), heyDeveloper);
}
function RSCDefaultRootErrorBoundary({
  hasRootLayout
}) {
  let error = _chunkUVEQGZIHjs.useRouteError.call(void 0, );
  if (hasRootLayout === void 0) {
    throw new Error("Missing 'hasRootLayout' prop");
  }
  return /* @__PURE__ */ _react2.default.createElement(
    RSCDefaultRootErrorBoundaryImpl,
    {
      renderAppShell: !hasRootLayout,
      error
    }
  );
}

// lib/rsc/route-modules.ts
function createRSCRouteModules(payload) {
  const routeModules = {};
  for (const match of payload.matches) {
    populateRSCRouteModules(routeModules, match);
  }
  return routeModules;
}
function populateRSCRouteModules(routeModules, matches) {
  matches = Array.isArray(matches) ? matches : [matches];
  for (const match of matches) {
    routeModules[match.id] = {
      links: match.links,
      meta: match.meta,
      default: noopComponent
    };
  }
}
var noopComponent = () => null;







exports.getHydrationData = getHydrationData; exports.RSCRouterGlobalErrorBoundary = RSCRouterGlobalErrorBoundary; exports.RSCDefaultRootErrorBoundary = RSCDefaultRootErrorBoundary; exports.createRSCRouteModules = createRSCRouteModules; exports.populateRSCRouteModules = populateRSCRouteModules;

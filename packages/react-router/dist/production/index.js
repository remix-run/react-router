"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/**
 * react-router v7.14.1
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use client";





var _chunk3SUPTI2Ujs = require('./chunk-3SUPTI2U.js');

























var _chunkLIOP3ILMjs = require('./chunk-LIOP3ILM.js');












































































































var _chunkUVEQGZIHjs = require('./chunk-UVEQGZIH.js');

// lib/dom/ssr/server.tsx
var _react = require('react'); var React = _interopRequireWildcard(_react); var React2 = _interopRequireWildcard(_react); var React3 = _interopRequireWildcard(_react);
function ServerRouter({
  context,
  url,
  nonce
}) {
  if (typeof url === "string") {
    url = new URL(url);
  }
  let { manifest, routeModules, criticalCss, serverHandoffString } = context;
  let routes = _chunkUVEQGZIHjs.createServerRoutes.call(void 0, 
    manifest.routes,
    routeModules,
    context.future,
    context.isSpaMode
  );
  context.staticHandlerContext.loaderData = {
    ...context.staticHandlerContext.loaderData
  };
  for (let match of context.staticHandlerContext.matches) {
    let routeId = match.route.id;
    let route = routeModules[routeId];
    let manifestRoute = context.manifest.routes[routeId];
    if (route && manifestRoute && _chunkUVEQGZIHjs.shouldHydrateRouteLoader.call(void 0, 
      routeId,
      route.clientLoader,
      manifestRoute.hasLoader,
      context.isSpaMode
    ) && (route.HydrateFallback || !manifestRoute.hasLoader)) {
      delete context.staticHandlerContext.loaderData[routeId];
    }
  }
  let router = _chunkLIOP3ILMjs.createStaticRouter.call(void 0, routes, context.staticHandlerContext);
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    _chunkUVEQGZIHjs.FrameworkContext.Provider,
    {
      value: {
        manifest,
        routeModules,
        criticalCss,
        serverHandoffString,
        future: context.future,
        ssr: context.ssr,
        isSpaMode: context.isSpaMode,
        routeDiscovery: context.routeDiscovery,
        serializeError: context.serializeError,
        renderMeta: context.renderMeta
      }
    },
    /* @__PURE__ */ React.createElement(_chunkUVEQGZIHjs.RemixErrorBoundary, { location: router.state.location }, /* @__PURE__ */ React.createElement(
      _chunkLIOP3ILMjs.StaticRouterProvider,
      {
        router,
        context: context.staticHandlerContext,
        hydrate: false
      }
    ))
  ), context.serverHandoffStream ? /* @__PURE__ */ React.createElement(React.Suspense, null, /* @__PURE__ */ React.createElement(
    _chunkUVEQGZIHjs.StreamTransfer,
    {
      context,
      identifier: 0,
      reader: context.serverHandoffStream.getReader(),
      textDecoder: new TextDecoder(),
      nonce
    }
  )) : null);
}

// lib/dom/ssr/routes-test-stub.tsx

function createRoutesStub(routes, _context) {
  return function RoutesTestStub({
    initialEntries,
    initialIndex,
    hydrationData,
    future
  }) {
    let routerRef = React2.useRef();
    let frameworkContextRef = React2.useRef();
    if (routerRef.current == null) {
      frameworkContextRef.current = {
        future: {
          unstable_passThroughRequests: _optionalChain([future, 'optionalAccess', _2 => _2.unstable_passThroughRequests]) === true,
          unstable_subResourceIntegrity: _optionalChain([future, 'optionalAccess', _3 => _3.unstable_subResourceIntegrity]) === true,
          v8_middleware: _optionalChain([future, 'optionalAccess', _4 => _4.v8_middleware]) === true,
          unstable_trailingSlashAwareDataRequests: _optionalChain([future, 'optionalAccess', _5 => _5.unstable_trailingSlashAwareDataRequests]) === true
        },
        manifest: {
          routes: {},
          entry: { imports: [], module: "" },
          url: "",
          version: ""
        },
        routeModules: {},
        ssr: false,
        isSpaMode: false,
        routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" }
      };
      let patched = processRoutes(
        // @ts-expect-error `StubRouteObject` is stricter about `loader`/`action`
        // types compared to `RouteObject`
        _chunkUVEQGZIHjs.convertRoutesToDataRoutes.call(void 0, routes, (r) => r),
        _context !== void 0 ? _context : _optionalChain([future, 'optionalAccess', _6 => _6.v8_middleware]) ? new (0, _chunkUVEQGZIHjs.RouterContextProvider)() : {},
        frameworkContextRef.current.manifest,
        frameworkContextRef.current.routeModules
      );
      routerRef.current = _chunkUVEQGZIHjs.createMemoryRouter.call(void 0, patched, {
        initialEntries,
        initialIndex,
        hydrationData
      });
    }
    return /* @__PURE__ */ React2.createElement(_chunkUVEQGZIHjs.FrameworkContext.Provider, { value: frameworkContextRef.current }, /* @__PURE__ */ React2.createElement(_chunkUVEQGZIHjs.RouterProvider, { router: routerRef.current }));
  };
}
function processRoutes(routes, context, manifest, routeModules, parentId) {
  return routes.map((route) => {
    if (!route.id) {
      throw new Error(
        "Expected a route.id in react-router processRoutes() function"
      );
    }
    let newRoute = {
      id: route.id,
      path: route.path,
      index: route.index,
      Component: route.Component ? _chunkUVEQGZIHjs.withComponentProps.call(void 0, route.Component) : void 0,
      HydrateFallback: route.HydrateFallback ? _chunkUVEQGZIHjs.withHydrateFallbackProps.call(void 0, route.HydrateFallback) : void 0,
      ErrorBoundary: route.ErrorBoundary ? _chunkUVEQGZIHjs.withErrorBoundaryProps.call(void 0, route.ErrorBoundary) : void 0,
      action: route.action ? (args) => route.action({ ...args, context }) : void 0,
      loader: route.loader ? (args) => route.loader({ ...args, context }) : void 0,
      middleware: route.middleware ? route.middleware.map(
        (mw) => (...args) => mw(
          { ...args[0], context },
          args[1]
        )
      ) : void 0,
      handle: route.handle,
      shouldRevalidate: route.shouldRevalidate
    };
    let entryRoute = {
      id: route.id,
      path: route.path,
      index: route.index,
      parentId,
      hasAction: route.action != null,
      hasLoader: route.loader != null,
      // When testing routes, you should be stubbing loader/action/middleware,
      // not trying to re-implement the full loader/clientLoader/SSR/hydration
      // flow. That is better tested via E2E tests.
      hasClientAction: false,
      hasClientLoader: false,
      hasClientMiddleware: false,
      hasErrorBoundary: route.ErrorBoundary != null,
      // any need for these?
      module: "build/stub-path-to-module.js",
      clientActionModule: void 0,
      clientLoaderModule: void 0,
      clientMiddlewareModule: void 0,
      hydrateFallbackModule: void 0
    };
    manifest.routes[newRoute.id] = entryRoute;
    routeModules[route.id] = {
      default: newRoute.Component || _chunkUVEQGZIHjs.Outlet,
      ErrorBoundary: newRoute.ErrorBoundary || void 0,
      handle: route.handle,
      links: route.links,
      meta: route.meta,
      shouldRevalidate: route.shouldRevalidate
    };
    if (route.children) {
      newRoute.children = processRoutes(
        route.children,
        context,
        manifest,
        routeModules,
        newRoute.id
      );
    }
    return newRoute;
  });
}

// lib/server-runtime/cookies.ts
var _cookie = require('cookie');

// lib/server-runtime/crypto.ts
var encoder = /* @__PURE__ */ new TextEncoder();
var sign = async (value, secret) => {
  let data2 = encoder.encode(value);
  let key = await createKey(secret, ["sign"]);
  let signature = await crypto.subtle.sign("HMAC", key, data2);
  let hash = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(
    /=+$/,
    ""
  );
  return value + "." + hash;
};
var unsign = async (cookie, secret) => {
  let index = cookie.lastIndexOf(".");
  let value = cookie.slice(0, index);
  let hash = cookie.slice(index + 1);
  let data2 = encoder.encode(value);
  let key = await createKey(secret, ["verify"]);
  try {
    let signature = byteStringToUint8Array(atob(hash));
    let valid = await crypto.subtle.verify("HMAC", key, signature, data2);
    return valid ? value : false;
  } catch (error) {
    return false;
  }
};
var createKey = async (secret, usages) => crypto.subtle.importKey(
  "raw",
  encoder.encode(secret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  usages
);
function byteStringToUint8Array(byteString) {
  let array = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    array[i] = byteString.charCodeAt(i);
  }
  return array;
}

// lib/server-runtime/cookies.ts
var createCookie = (name, cookieOptions = {}) => {
  let { secrets = [], ...options } = {
    path: "/",
    sameSite: "lax",
    ...cookieOptions
  };
  warnOnceAboutExpiresCookie(name, options.expires);
  return {
    get name() {
      return name;
    },
    get isSigned() {
      return secrets.length > 0;
    },
    get expires() {
      return typeof options.maxAge !== "undefined" ? new Date(Date.now() + options.maxAge * 1e3) : options.expires;
    },
    async parse(cookieHeader, parseOptions) {
      if (!cookieHeader) return null;
      let cookies = _cookie.parse.call(void 0, cookieHeader, { ...options, ...parseOptions });
      if (name in cookies) {
        let value = cookies[name];
        if (typeof value === "string" && value !== "") {
          let decoded = await decodeCookieValue(value, secrets);
          return decoded;
        } else {
          return "";
        }
      } else {
        return null;
      }
    },
    async serialize(value, serializeOptions) {
      return _cookie.serialize.call(void 0, 
        name,
        value === "" ? "" : await encodeCookieValue(value, secrets),
        {
          ...options,
          ...serializeOptions
        }
      );
    }
  };
};
var isCookie = (object) => {
  return object != null && typeof object.name === "string" && typeof object.isSigned === "boolean" && typeof object.parse === "function" && typeof object.serialize === "function";
};
async function encodeCookieValue(value, secrets) {
  let encoded = encodeData(value);
  if (secrets.length > 0) {
    encoded = await sign(encoded, secrets[0]);
  }
  return encoded;
}
async function decodeCookieValue(value, secrets) {
  if (secrets.length > 0) {
    for (let secret of secrets) {
      let unsignedValue = await unsign(value, secret);
      if (unsignedValue !== false) {
        return decodeData(unsignedValue);
      }
    }
    return null;
  }
  return decodeData(value);
}
function encodeData(value) {
  return btoa(myUnescape(encodeURIComponent(JSON.stringify(value))));
}
function decodeData(value) {
  try {
    return JSON.parse(decodeURIComponent(myEscape(atob(value))));
  } catch (error) {
    return {};
  }
}
function myEscape(value) {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, code;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (/[\w*+\-./@]/.exec(chr)) {
      result += chr;
    } else {
      code = chr.charCodeAt(0);
      if (code < 256) {
        result += "%" + hex(code, 2);
      } else {
        result += "%u" + hex(code, 4).toUpperCase();
      }
    }
  }
  return result;
}
function hex(code, length) {
  let result = code.toString(16);
  while (result.length < length) result = "0" + result;
  return result;
}
function myUnescape(value) {
  let str = value.toString();
  let result = "";
  let index = 0;
  let chr, part;
  while (index < str.length) {
    chr = str.charAt(index++);
    if (chr === "%") {
      if (str.charAt(index) === "u") {
        part = str.slice(index + 1, index + 5);
        if (/^[\da-f]{4}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 5;
          continue;
        }
      } else {
        part = str.slice(index, index + 2);
        if (/^[\da-f]{2}$/i.exec(part)) {
          result += String.fromCharCode(parseInt(part, 16));
          index += 2;
          continue;
        }
      }
    }
    result += chr;
  }
  return result;
}
function warnOnceAboutExpiresCookie(name, expires) {
  _chunkUVEQGZIHjs.warnOnce.call(void 0, 
    !expires,
    `The "${name}" cookie has an "expires" property set. This will cause the expires value to not be updated when the session is committed. Instead, you should set the expires value when serializing the cookie. You can use \`commitSession(session, { expires })\` if using a session storage object, or \`cookie.serialize("value", { expires })\` if you're using the cookie directly.`
  );
}

// lib/server-runtime/entry.ts
function createEntryRouteModules(manifest) {
  return Object.keys(manifest).reduce((memo, routeId) => {
    let route = manifest[routeId];
    if (route) {
      memo[routeId] = route.module;
    }
    return memo;
  }, {});
}

// lib/server-runtime/mode.ts
var ServerMode = /* @__PURE__ */ ((ServerMode2) => {
  ServerMode2["Development"] = "development";
  ServerMode2["Production"] = "production";
  ServerMode2["Test"] = "test";
  return ServerMode2;
})(ServerMode || {});
function isServerMode(value) {
  return value === "development" /* Development */ || value === "production" /* Production */ || value === "test" /* Test */;
}

// lib/server-runtime/errors.ts
function sanitizeError(error, serverMode) {
  if (error instanceof Error && serverMode !== "development" /* Development */) {
    let sanitized = new Error("Unexpected Server Error");
    sanitized.stack = void 0;
    return sanitized;
  }
  return error;
}
function sanitizeErrors(errors, serverMode) {
  return Object.entries(errors).reduce((acc, [routeId, error]) => {
    return Object.assign(acc, { [routeId]: sanitizeError(error, serverMode) });
  }, {});
}
function serializeError(error, serverMode) {
  let sanitized = sanitizeError(error, serverMode);
  return {
    message: sanitized.message,
    stack: sanitized.stack
  };
}
function serializeErrors(errors, serverMode) {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized = {};
  for (let [key, val] of entries) {
    if (_chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, val)) {
      serialized[key] = { ...val, __type: "RouteErrorResponse" };
    } else if (val instanceof Error) {
      let sanitized = sanitizeError(val, serverMode);
      serialized[key] = {
        message: sanitized.message,
        stack: sanitized.stack,
        __type: "Error",
        // If this is a subclass (i.e., ReferenceError), send up the type so we
        // can re-create the same type during hydration.  This will only apply
        // in dev mode since all production errors are sanitized to normal
        // Error instances
        ...sanitized.name !== "Error" ? {
          __subType: sanitized.name
        } : {}
      };
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

// lib/server-runtime/routeMatching.ts
function matchServerRoutes(routes, pathname, basename) {
  let matches = _chunkUVEQGZIHjs.matchRoutes.call(void 0, 
    routes,
    pathname,
    basename
  );
  if (!matches) return null;
  return matches.map((match) => ({
    params: match.params,
    pathname: match.pathname,
    route: match.route
  }));
}

// lib/server-runtime/data.ts
async function callRouteHandler(handler, args, future) {
  let result = await handler({
    request: future.unstable_passThroughRequests ? args.request : stripRoutesParam(stripIndexParam(args.request)),
    unstable_url: args.unstable_url,
    params: args.params,
    context: args.context,
    unstable_pattern: args.unstable_pattern
  });
  if (_chunkUVEQGZIHjs.isDataWithResponseInit.call(void 0, result) && result.init && result.init.status && _chunkUVEQGZIHjs.isRedirectStatusCode.call(void 0, result.init.status)) {
    throw new Response(null, result.init);
  }
  return result;
}
function stripIndexParam(request) {
  let url = new URL(request.url);
  let indexValues = url.searchParams.getAll("index");
  url.searchParams.delete("index");
  let indexValuesToKeep = [];
  for (let indexValue of indexValues) {
    if (indexValue) {
      indexValuesToKeep.push(indexValue);
    }
  }
  for (let toKeep of indexValuesToKeep) {
    url.searchParams.append("index", toKeep);
  }
  let init = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal
  };
  if (init.body) {
    init.duplex = "half";
  }
  return new Request(url.href, init);
}
function stripRoutesParam(request) {
  let url = new URL(request.url);
  url.searchParams.delete("_routes");
  let init = {
    method: request.method,
    body: request.body,
    headers: request.headers,
    signal: request.signal
  };
  if (init.body) {
    init.duplex = "half";
  }
  return new Request(url.href, init);
}

// lib/server-runtime/invariant.ts
function invariant2(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
}

// lib/server-runtime/dev.ts
var globalDevServerHooksKey = "__reactRouterDevServerHooks";
function setDevServerHooks(devServerHooks) {
  globalThis[globalDevServerHooksKey] = devServerHooks;
}
function getDevServerHooks() {
  return globalThis[globalDevServerHooksKey];
}
function getBuildTimeHeader(request, headerName) {
  if (typeof process !== "undefined") {
    try {
      if (_optionalChain([process, 'access', _7 => _7.env, 'optionalAccess', _8 => _8.IS_RR_BUILD_REQUEST]) === "yes") {
        return request.headers.get(headerName);
      }
    } catch (e) {
    }
  }
  return null;
}

// lib/server-runtime/routes.ts
function groupRoutesByParentId(manifest) {
  let routes = {};
  Object.values(manifest).forEach((route) => {
    if (route) {
      let parentId = route.parentId || "";
      if (!routes[parentId]) {
        routes[parentId] = [];
      }
      routes[parentId].push(route);
    }
  });
  return routes;
}
function createRoutes(manifest, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) {
  return (routesByParentId[parentId] || []).map((route) => ({
    ...route,
    children: createRoutes(manifest, route.id, routesByParentId)
  }));
}
function createStaticHandlerDataRoutes(manifest, future, parentId = "", routesByParentId = groupRoutesByParentId(manifest)) {
  return (routesByParentId[parentId] || []).map((route) => {
    let commonRoute = {
      // Always include root due to default boundaries
      hasErrorBoundary: route.id === "root" || route.module.ErrorBoundary != null,
      id: route.id,
      path: route.path,
      middleware: route.module.middleware,
      // Need to use RR's version in the param typed here to permit the optional
      // context even though we know it'll always be provided in remix
      loader: route.module.loader ? async (args) => {
        let preRenderedData = getBuildTimeHeader(
          args.request,
          "X-React-Router-Prerender-Data"
        );
        if (preRenderedData != null) {
          let encoded = preRenderedData ? decodeURI(preRenderedData) : preRenderedData;
          invariant2(encoded, "Missing prerendered data for route");
          let uint8array = new TextEncoder().encode(encoded);
          let stream = new ReadableStream({
            start(controller) {
              controller.enqueue(uint8array);
              controller.close();
            }
          });
          let decoded = await _chunkUVEQGZIHjs.decodeViaTurboStream.call(void 0, stream, global);
          let data2 = decoded.value;
          if (data2 && _chunkUVEQGZIHjs.SingleFetchRedirectSymbol in data2) {
            let result = data2[_chunkUVEQGZIHjs.SingleFetchRedirectSymbol];
            let init = { status: result.status };
            if (result.reload) {
              throw _chunkUVEQGZIHjs.redirectDocument.call(void 0, result.redirect, init);
            } else if (result.replace) {
              throw _chunkUVEQGZIHjs.replace.call(void 0, result.redirect, init);
            } else {
              throw _chunkUVEQGZIHjs.redirect.call(void 0, result.redirect, init);
            }
          } else {
            invariant2(
              data2 && route.id in data2,
              "Unable to decode prerendered data"
            );
            let result = data2[route.id];
            invariant2(
              "data" in result,
              "Unable to process prerendered data"
            );
            return result.data;
          }
        }
        let val = await callRouteHandler(
          route.module.loader,
          args,
          future
        );
        return val;
      } : void 0,
      action: route.module.action ? (args) => callRouteHandler(route.module.action, args, future) : void 0,
      handle: route.module.handle
    };
    return route.index ? {
      index: true,
      ...commonRoute
    } : {
      caseSensitive: route.caseSensitive,
      children: createStaticHandlerDataRoutes(
        manifest,
        future,
        route.id,
        routesByParentId
      ),
      ...commonRoute
    };
  });
}

// lib/server-runtime/serverHandoff.ts
function createServerHandoffString(serverHandoff) {
  return _chunkUVEQGZIHjs.escapeHtml.call(void 0, JSON.stringify(serverHandoff));
}

// lib/server-runtime/headers.ts
var _setcookieparser = require('set-cookie-parser');
function getDocumentHeaders(context, build) {
  return getDocumentHeadersImpl(context, (m) => {
    let route = build.routes[m.route.id];
    invariant2(route, `Route with id "${m.route.id}" not found in build`);
    return route.module.headers;
  });
}
function getDocumentHeadersImpl(context, getRouteHeadersFn, _defaultHeaders) {
  let boundaryIdx = context.errors ? context.matches.findIndex((m) => context.errors[m.route.id]) : -1;
  let matches = boundaryIdx >= 0 ? context.matches.slice(0, boundaryIdx + 1) : context.matches;
  let errorHeaders;
  if (boundaryIdx >= 0) {
    let { actionHeaders, actionData, loaderHeaders, loaderData } = context;
    context.matches.slice(boundaryIdx).some((match) => {
      let id = match.route.id;
      if (actionHeaders[id] && (!actionData || !actionData.hasOwnProperty(id))) {
        errorHeaders = actionHeaders[id];
      } else if (loaderHeaders[id] && !loaderData.hasOwnProperty(id)) {
        errorHeaders = loaderHeaders[id];
      }
      return errorHeaders != null;
    });
  }
  const defaultHeaders = new Headers(_defaultHeaders);
  return matches.reduce((parentHeaders, match, idx) => {
    let { id } = match.route;
    let loaderHeaders = context.loaderHeaders[id] || new Headers();
    let actionHeaders = context.actionHeaders[id] || new Headers();
    let includeErrorHeaders = errorHeaders != null && idx === matches.length - 1;
    let includeErrorCookies = includeErrorHeaders && errorHeaders !== loaderHeaders && errorHeaders !== actionHeaders;
    let headersFn = getRouteHeadersFn(match);
    if (headersFn == null) {
      let headers2 = new Headers(parentHeaders);
      if (includeErrorCookies) {
        prependCookies(errorHeaders, headers2);
      }
      prependCookies(actionHeaders, headers2);
      prependCookies(loaderHeaders, headers2);
      return headers2;
    }
    let headers = new Headers(
      typeof headersFn === "function" ? headersFn({
        loaderHeaders,
        parentHeaders,
        actionHeaders,
        errorHeaders: includeErrorHeaders ? errorHeaders : void 0
      }) : headersFn
    );
    if (includeErrorCookies) {
      prependCookies(errorHeaders, headers);
    }
    prependCookies(actionHeaders, headers);
    prependCookies(loaderHeaders, headers);
    prependCookies(parentHeaders, headers);
    return headers;
  }, new Headers(defaultHeaders));
}
function prependCookies(parentHeaders, childHeaders) {
  let parentSetCookieString = parentHeaders.get("Set-Cookie");
  if (parentSetCookieString) {
    let cookies = _setcookieparser.splitCookiesString.call(void 0, parentSetCookieString);
    let childCookies = new Set(childHeaders.getSetCookie());
    cookies.forEach((cookie) => {
      if (!childCookies.has(cookie)) {
        childHeaders.append("Set-Cookie", cookie);
      }
    });
  }
}

// lib/actions.ts
function throwIfPotentialCSRFAttack(headers, allowedActionOrigins) {
  let originHeader = headers.get("origin");
  let originDomain = null;
  try {
    originDomain = typeof originHeader === "string" && originHeader !== "null" ? new URL(originHeader).host : originHeader;
  } catch (e2) {
    throw new Error(
      `\`origin\` header is not a valid URL. Aborting the action.`
    );
  }
  let host = parseHostHeader(headers);
  if (originDomain && (!host || originDomain !== host.value)) {
    if (!isAllowedOrigin(originDomain, allowedActionOrigins)) {
      if (host) {
        throw new Error(
          `${host.type} header does not match \`origin\` header from a forwarded action request. Aborting the action.`
        );
      } else {
        throw new Error(
          "`x-forwarded-host` or `host` headers are not provided. One of these is needed to compare the `origin` header from a forwarded action request. Aborting the action."
        );
      }
    }
  }
}
function matchWildcardDomain(domain, pattern) {
  const domainParts = domain.split(".");
  const patternParts = pattern.split(".");
  if (patternParts.length < 1) {
    return false;
  }
  if (domainParts.length < patternParts.length) {
    return false;
  }
  while (patternParts.length) {
    const patternPart = patternParts.pop();
    const domainPart = domainParts.pop();
    switch (patternPart) {
      case "": {
        return false;
      }
      case "*": {
        if (domainPart) {
          continue;
        } else {
          return false;
        }
      }
      case "**": {
        if (patternParts.length > 0) {
          return false;
        }
        return domainPart !== void 0;
      }
      case void 0:
      default: {
        if (domainPart !== patternPart) {
          return false;
        }
      }
    }
  }
  return domainParts.length === 0;
}
function isAllowedOrigin(originDomain, allowedActionOrigins = []) {
  return allowedActionOrigins.some(
    (allowedOrigin) => allowedOrigin && (allowedOrigin === originDomain || matchWildcardDomain(originDomain, allowedOrigin))
  );
}
function parseHostHeader(headers) {
  let forwardedHostHeader = headers.get("x-forwarded-host");
  let forwardedHostValue = _optionalChain([forwardedHostHeader, 'optionalAccess', _9 => _9.split, 'call', _10 => _10(","), 'access', _11 => _11[0], 'optionalAccess', _12 => _12.trim, 'call', _13 => _13()]);
  let hostHeader = headers.get("host");
  return forwardedHostValue ? {
    type: "x-forwarded-host",
    value: forwardedHostValue
  } : hostHeader ? {
    type: "host",
    value: hostHeader
  } : void 0;
}

// lib/server-runtime/urls.ts
function getNormalizedPath(request, basename, future) {
  basename = basename || "/";
  let url = new URL(request.url);
  let pathname = url.pathname;
  if (_optionalChain([future, 'optionalAccess', _14 => _14.unstable_trailingSlashAwareDataRequests])) {
    if (pathname.endsWith("/_.data")) {
      pathname = pathname.replace(/_\.data$/, "");
    } else {
      pathname = pathname.replace(/\.data$/, "");
    }
  } else {
    if (_chunkUVEQGZIHjs.stripBasename.call(void 0, pathname, basename) === "/_root.data") {
      pathname = basename;
    } else if (pathname.endsWith(".data")) {
      pathname = pathname.replace(/\.data$/, "");
    }
    if (_chunkUVEQGZIHjs.stripBasename.call(void 0, pathname, basename) !== "/" && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
  }
  let searchParams = new URLSearchParams(url.search);
  searchParams.delete("_routes");
  let search = searchParams.toString();
  if (search) {
    search = `?${search}`;
  }
  return {
    pathname,
    search,
    // No hashes on the server
    hash: ""
  };
}

// lib/server-runtime/single-fetch.ts
var SERVER_NO_BODY_STATUS_CODES = /* @__PURE__ */ new Set([
  ..._chunkUVEQGZIHjs.NO_BODY_STATUS_CODES,
  304
]);
async function singleFetchAction(build, serverMode, staticHandler, request, handlerUrl, loadContext, handleError) {
  try {
    try {
      throwIfPotentialCSRFAttack(
        request.headers,
        Array.isArray(build.allowedActionOrigins) ? build.allowedActionOrigins : []
      );
    } catch (e) {
      return handleQueryError(new Error("Bad Request"), 400);
    }
    let handlerRequest = build.future.unstable_passThroughRequests ? request : new Request(handlerUrl, {
      method: request.method,
      body: request.body,
      headers: request.headers,
      signal: request.signal,
      ...request.body ? { duplex: "half" } : void 0
    });
    let result = await staticHandler.query(handlerRequest, {
      requestContext: loadContext,
      skipLoaderErrorBubbling: true,
      skipRevalidation: true,
      generateMiddlewareResponse: build.future.v8_middleware ? async (query) => {
        try {
          let innerResult = await query(handlerRequest);
          return handleQueryResult(innerResult);
        } catch (error) {
          return handleQueryError(error);
        }
      } : void 0,
      unstable_normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    return handleQueryResult(result);
  } catch (error) {
    return handleQueryError(error);
  }
  function handleQueryResult(result) {
    return _chunkUVEQGZIHjs.isResponse.call(void 0, result) ? result : staticContextToResponse(result);
  }
  function handleQueryError(error, status = 500) {
    handleError(error);
    return generateSingleFetchResponse(request, build, serverMode, {
      result: { error },
      headers: new Headers(),
      status
    });
  }
  function staticContextToResponse(context) {
    let headers = getDocumentHeaders(context, build);
    if (_chunkUVEQGZIHjs.isRedirectStatusCode.call(void 0, context.statusCode) && headers.has("Location")) {
      return new Response(null, { status: context.statusCode, headers });
    }
    if (context.errors) {
      Object.values(context.errors).forEach((err) => {
        if (!_chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, err) || err.error) {
          handleError(err);
        }
      });
      context.errors = sanitizeErrors(context.errors, serverMode);
    }
    let singleFetchResult;
    if (context.errors) {
      singleFetchResult = { error: Object.values(context.errors)[0] };
    } else {
      singleFetchResult = {
        data: Object.values(context.actionData || {})[0]
      };
    }
    return generateSingleFetchResponse(request, build, serverMode, {
      result: singleFetchResult,
      headers,
      status: context.statusCode
    });
  }
}
async function singleFetchLoaders(build, serverMode, staticHandler, request, handlerUrl, loadContext, handleError) {
  let routesParam = new URL(request.url).searchParams.get("_routes");
  let loadRouteIds = routesParam ? new Set(routesParam.split(",")) : null;
  try {
    let handlerRequest = build.future.unstable_passThroughRequests ? request : new Request(handlerUrl, {
      headers: request.headers,
      signal: request.signal
    });
    let result = await staticHandler.query(handlerRequest, {
      requestContext: loadContext,
      filterMatchesToLoad: (m) => !loadRouteIds || loadRouteIds.has(m.route.id),
      skipLoaderErrorBubbling: true,
      generateMiddlewareResponse: build.future.v8_middleware ? async (query) => {
        try {
          let innerResult = await query(handlerRequest);
          return handleQueryResult(innerResult);
        } catch (error) {
          return handleQueryError(error);
        }
      } : void 0,
      unstable_normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    return handleQueryResult(result);
  } catch (error) {
    return handleQueryError(error);
  }
  function handleQueryResult(result) {
    return _chunkUVEQGZIHjs.isResponse.call(void 0, result) ? result : staticContextToResponse(result);
  }
  function handleQueryError(error) {
    handleError(error);
    return generateSingleFetchResponse(request, build, serverMode, {
      result: { error },
      headers: new Headers(),
      status: 500
    });
  }
  function staticContextToResponse(context) {
    let headers = getDocumentHeaders(context, build);
    if (_chunkUVEQGZIHjs.isRedirectStatusCode.call(void 0, context.statusCode) && headers.has("Location")) {
      return new Response(null, { status: context.statusCode, headers });
    }
    if (context.errors) {
      Object.values(context.errors).forEach((err) => {
        if (!_chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, err) || err.error) {
          handleError(err);
        }
      });
      context.errors = sanitizeErrors(context.errors, serverMode);
    }
    let results = {};
    let loadedMatches = new Set(
      context.matches.filter(
        (m) => loadRouteIds ? loadRouteIds.has(m.route.id) : m.route.loader != null
      ).map((m) => m.route.id)
    );
    if (context.errors) {
      for (let [id, error] of Object.entries(context.errors)) {
        results[id] = { error };
      }
    }
    for (let [id, data2] of Object.entries(context.loaderData)) {
      if (!(id in results) && loadedMatches.has(id)) {
        results[id] = { data: data2 };
      }
    }
    return generateSingleFetchResponse(request, build, serverMode, {
      result: results,
      headers,
      status: context.statusCode
    });
  }
}
function generateSingleFetchResponse(request, build, serverMode, {
  result,
  headers,
  status
}) {
  let resultHeaders = new Headers(headers);
  resultHeaders.set("X-Remix-Response", "yes");
  if (SERVER_NO_BODY_STATUS_CODES.has(status)) {
    return new Response(null, { status, headers: resultHeaders });
  }
  resultHeaders.set("Content-Type", "text/x-script");
  resultHeaders.delete("Content-Length");
  return new Response(
    encodeViaTurboStream(
      result,
      request.signal,
      build.entry.module.streamTimeout,
      serverMode
    ),
    {
      status: status || 200,
      headers: resultHeaders
    }
  );
}
function generateSingleFetchRedirectResponse(redirectResponse, request, build, serverMode) {
  let redirect2 = getSingleFetchRedirect(
    redirectResponse.status,
    redirectResponse.headers,
    build.basename
  );
  let headers = new Headers(redirectResponse.headers);
  headers.delete("Location");
  headers.set("Content-Type", "text/x-script");
  return generateSingleFetchResponse(request, build, serverMode, {
    result: request.method === "GET" ? { [_chunkUVEQGZIHjs.SingleFetchRedirectSymbol]: redirect2 } : redirect2,
    headers,
    status: _chunkUVEQGZIHjs.SINGLE_FETCH_REDIRECT_STATUS
  });
}
function getSingleFetchRedirect(status, headers, basename) {
  let redirect2 = headers.get("Location");
  if (basename) {
    redirect2 = _chunkUVEQGZIHjs.stripBasename.call(void 0, redirect2, basename) || redirect2;
  }
  return {
    redirect: redirect2,
    status,
    revalidate: (
      // Technically X-Remix-Revalidate isn't needed here - that was an implementation
      // detail of ?_data requests as our way to tell the front end to revalidate when
      // we didn't have a response body to include that information in.
      // With single fetch, we tell the front end via this revalidate boolean field.
      // However, we're respecting it for now because it may be something folks have
      // used in their own responses
      // TODO(v3): Consider removing or making this official public API
      headers.has("X-Remix-Revalidate") || headers.has("Set-Cookie")
    ),
    reload: headers.has("X-Remix-Reload-Document"),
    replace: headers.has("X-Remix-Replace")
  };
}
function encodeViaTurboStream(data2, requestSignal, streamTimeout, serverMode) {
  let controller = new AbortController();
  let timeoutId = setTimeout(
    () => {
      controller.abort(new Error("Server Timeout"));
      cleanupCallbacks();
    },
    typeof streamTimeout === "number" ? streamTimeout : 4950
  );
  let abortControllerOnRequestAbort = () => {
    controller.abort(requestSignal.reason);
    cleanupCallbacks();
  };
  requestSignal.addEventListener("abort", abortControllerOnRequestAbort);
  let cleanupCallbacks = () => {
    clearTimeout(timeoutId);
    requestSignal.removeEventListener("abort", abortControllerOnRequestAbort);
  };
  return _chunkUVEQGZIHjs.encode.call(void 0, data2, {
    signal: controller.signal,
    onComplete: cleanupCallbacks,
    plugins: [
      (value) => {
        if (value instanceof Error) {
          let { name, message, stack } = serverMode === "production" /* Production */ ? sanitizeError(value, serverMode) : value;
          return ["SanitizedError", name, message, stack];
        }
        if (value instanceof _chunkUVEQGZIHjs.ErrorResponseImpl) {
          let { data: data3, status, statusText } = value;
          return ["ErrorResponse", data3, status, statusText];
        }
        if (value && typeof value === "object" && _chunkUVEQGZIHjs.SingleFetchRedirectSymbol in value) {
          return ["SingleFetchRedirect", value[_chunkUVEQGZIHjs.SingleFetchRedirectSymbol]];
        }
      }
    ],
    postPlugins: [
      (value) => {
        if (!value) return;
        if (typeof value !== "object") return;
        return [
          "SingleFetchClassInstance",
          Object.fromEntries(Object.entries(value))
        ];
      },
      () => ["SingleFetchFallback"]
    ]
  });
}

// lib/server-runtime/server.ts
function derive(build, mode) {
  let routes = createRoutes(build.routes);
  let dataRoutes = createStaticHandlerDataRoutes(build.routes, build.future);
  let serverMode = isServerMode(mode) ? mode : "production" /* Production */;
  let staticHandler = _chunkUVEQGZIHjs.createStaticHandler.call(void 0, dataRoutes, {
    basename: build.basename,
    unstable_instrumentations: build.entry.module.unstable_instrumentations
  });
  let errorHandler = build.entry.module.handleError || ((error, { request }) => {
    if (serverMode !== "test" /* Test */ && !request.signal.aborted) {
      console.error(
        // @ts-expect-error This is "private" from users but intended for internal use
        _chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, error) && error.error ? error.error : error
      );
    }
  });
  let requestHandler = async (request, initialContext) => {
    let params = {};
    let loadContext;
    let handleError = (error) => {
      if (mode === "development" /* Development */) {
        _optionalChain([getDevServerHooks, 'call', _15 => _15(), 'optionalAccess', _16 => _16.processRequestError, 'optionalCall', _17 => _17(error)]);
      }
      errorHandler(error, {
        context: loadContext,
        params,
        request
      });
    };
    if (build.future.v8_middleware) {
      if (initialContext && !(initialContext instanceof _chunkUVEQGZIHjs.RouterContextProvider)) {
        let error = new Error(
          "Invalid `context` value provided to `handleRequest`. When middleware is enabled you must return an instance of `RouterContextProvider` from your `getLoadContext` function."
        );
        handleError(error);
        return returnLastResortErrorResponse(error, serverMode);
      }
      loadContext = initialContext || new (0, _chunkUVEQGZIHjs.RouterContextProvider)();
    } else {
      loadContext = initialContext || {};
    }
    let requestUrl = new URL(request.url);
    let normalizedPathname = getNormalizedPath(
      request,
      build.basename,
      build.future
    ).pathname;
    let isSpaMode = getBuildTimeHeader(request, "X-React-Router-SPA-Mode") === "yes";
    if (!build.ssr) {
      let decodedPath = decodeURI(normalizedPathname);
      if (build.basename && build.basename !== "/") {
        let strippedPath = _chunkUVEQGZIHjs.stripBasename.call(void 0, decodedPath, build.basename);
        if (strippedPath == null) {
          errorHandler(
            new (0, _chunkUVEQGZIHjs.ErrorResponseImpl)(
              404,
              "Not Found",
              `Refusing to prerender the \`${decodedPath}\` path because it does not start with the basename \`${build.basename}\``
            ),
            {
              context: loadContext,
              params,
              request
            }
          );
          return new Response("Not Found", {
            status: 404,
            statusText: "Not Found"
          });
        }
        decodedPath = strippedPath;
      }
      if (build.prerender.length === 0) {
        isSpaMode = true;
      } else if (!build.prerender.includes(decodedPath) && !build.prerender.includes(decodedPath + "/")) {
        if (requestUrl.pathname.endsWith(".data")) {
          errorHandler(
            new (0, _chunkUVEQGZIHjs.ErrorResponseImpl)(
              404,
              "Not Found",
              `Refusing to SSR the path \`${decodedPath}\` because \`ssr:false\` is set and the path is not included in the \`prerender\` config, so in production the path will be a 404.`
            ),
            {
              context: loadContext,
              params,
              request
            }
          );
          return new Response("Not Found", {
            status: 404,
            statusText: "Not Found"
          });
        } else {
          isSpaMode = true;
        }
      }
    }
    let manifestUrl = _chunkUVEQGZIHjs.getManifestPath.call(void 0, 
      build.routeDiscovery.manifestPath,
      build.basename
    );
    if (requestUrl.pathname === manifestUrl) {
      try {
        let res = await handleManifestRequest(build, routes, requestUrl);
        return res;
      } catch (e) {
        handleError(e);
        return new Response("Unknown Server Error", { status: 500 });
      }
    }
    let matches = matchServerRoutes(routes, normalizedPathname, build.basename);
    if (matches && matches.length > 0) {
      Object.assign(params, matches[0].params);
    }
    let response;
    if (requestUrl.pathname.endsWith(".data")) {
      let singleFetchMatches = matchServerRoutes(
        routes,
        normalizedPathname,
        build.basename
      );
      response = await handleSingleFetchRequest(
        serverMode,
        build,
        staticHandler,
        request,
        normalizedPathname,
        loadContext,
        handleError
      );
      if (_chunkUVEQGZIHjs.isRedirectResponse.call(void 0, response)) {
        response = generateSingleFetchRedirectResponse(
          response,
          request,
          build,
          serverMode
        );
      }
      if (build.entry.module.handleDataRequest) {
        response = await build.entry.module.handleDataRequest(response, {
          context: loadContext,
          params: singleFetchMatches ? singleFetchMatches[0].params : {},
          request
        });
        if (_chunkUVEQGZIHjs.isRedirectResponse.call(void 0, response)) {
          response = generateSingleFetchRedirectResponse(
            response,
            request,
            build,
            serverMode
          );
        }
      }
    } else if (!isSpaMode && matches && matches[matches.length - 1].route.module.default == null && matches[matches.length - 1].route.module.ErrorBoundary == null) {
      response = await handleResourceRequest(
        serverMode,
        build,
        staticHandler,
        matches.slice(-1)[0].route.id,
        request,
        loadContext,
        handleError
      );
    } else {
      let { pathname } = requestUrl;
      let criticalCss = void 0;
      if (build.unstable_getCriticalCss) {
        criticalCss = await build.unstable_getCriticalCss({ pathname });
      } else if (mode === "development" /* Development */ && _optionalChain([getDevServerHooks, 'call', _18 => _18(), 'optionalAccess', _19 => _19.getCriticalCss])) {
        criticalCss = await _optionalChain([getDevServerHooks, 'call', _20 => _20(), 'optionalAccess', _21 => _21.getCriticalCss, 'optionalCall', _22 => _22(pathname)]);
      }
      response = await handleDocumentRequest(
        serverMode,
        build,
        staticHandler,
        request,
        loadContext,
        handleError,
        isSpaMode,
        criticalCss
      );
    }
    if (request.method === "HEAD") {
      return new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText
      });
    }
    return response;
  };
  if (build.entry.module.unstable_instrumentations) {
    requestHandler = _chunkUVEQGZIHjs.instrumentHandler.call(void 0, 
      requestHandler,
      build.entry.module.unstable_instrumentations.map((i) => i.handler).filter(Boolean)
    );
  }
  return {
    routes,
    dataRoutes,
    serverMode,
    staticHandler,
    errorHandler,
    requestHandler
  };
}
var createRequestHandler = (build, mode) => {
  let _build;
  let routes;
  let serverMode;
  let staticHandler;
  let errorHandler;
  let _requestHandler;
  return async function requestHandler(request, initialContext) {
    _build = typeof build === "function" ? await build() : build;
    if (typeof build === "function") {
      let derived = derive(_build, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
      _requestHandler = derived.requestHandler;
    } else if (!routes || !serverMode || !staticHandler || !errorHandler || !_requestHandler) {
      let derived = derive(_build, mode);
      routes = derived.routes;
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
      _requestHandler = derived.requestHandler;
    }
    return _requestHandler(request, initialContext);
  };
};
async function handleManifestRequest(build, routes, url) {
  if (build.assets.version !== url.searchParams.get("version")) {
    return new Response(null, {
      status: 204,
      headers: {
        "X-Remix-Reload-Document": "true"
      }
    });
  }
  let patches = {};
  if (url.searchParams.has("paths")) {
    let paths = /* @__PURE__ */ new Set();
    let pathParam = url.searchParams.get("paths") || "";
    let requestedPaths = pathParam.split(",").filter(Boolean);
    requestedPaths.forEach((path) => {
      if (!path.startsWith("/")) {
        path = `/${path}`;
      }
      let segments = path.split("/").slice(1);
      segments.forEach((_, i) => {
        let partialPath = segments.slice(0, i + 1).join("/");
        paths.add(`/${partialPath}`);
      });
    });
    for (let path of paths) {
      let matches = matchServerRoutes(routes, path, build.basename);
      if (matches) {
        for (let match of matches) {
          let routeId = match.route.id;
          let route = build.assets.routes[routeId];
          if (route) {
            patches[routeId] = route;
          }
        }
      }
    }
    return Response.json(patches, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  }
  return new Response("Invalid Request", { status: 400 });
}
async function handleSingleFetchRequest(serverMode, build, staticHandler, request, normalizedPath, loadContext, handleError) {
  let handlerUrl = new URL(request.url);
  handlerUrl.pathname = normalizedPath;
  let response = request.method !== "GET" ? await singleFetchAction(
    build,
    serverMode,
    staticHandler,
    request,
    handlerUrl,
    loadContext,
    handleError
  ) : await singleFetchLoaders(
    build,
    serverMode,
    staticHandler,
    request,
    handlerUrl,
    loadContext,
    handleError
  );
  return response;
}
async function handleDocumentRequest(serverMode, build, staticHandler, request, loadContext, handleError, isSpaMode, criticalCss) {
  try {
    if (request.method === "POST") {
      try {
        throwIfPotentialCSRFAttack(
          request.headers,
          Array.isArray(build.allowedActionOrigins) ? build.allowedActionOrigins : []
        );
      } catch (e) {
        handleError(e);
        return new Response("Bad Request", { status: 400 });
      }
    }
    let result = await staticHandler.query(request, {
      requestContext: loadContext,
      generateMiddlewareResponse: build.future.v8_middleware ? async (query) => {
        try {
          let innerResult = await query(request);
          if (!_chunkUVEQGZIHjs.isResponse.call(void 0, innerResult)) {
            innerResult = await renderHtml(innerResult, isSpaMode);
          }
          return innerResult;
        } catch (error) {
          handleError(error);
          return new Response(null, { status: 500 });
        }
      } : void 0,
      unstable_normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    if (!_chunkUVEQGZIHjs.isResponse.call(void 0, result)) {
      result = await renderHtml(result, isSpaMode);
    }
    return result;
  } catch (error) {
    handleError(error);
    return new Response(null, { status: 500 });
  }
  async function renderHtml(context, isSpaMode2) {
    let headers = getDocumentHeaders(context, build);
    if (SERVER_NO_BODY_STATUS_CODES.has(context.statusCode)) {
      return new Response(null, { status: context.statusCode, headers });
    }
    if (context.errors) {
      Object.values(context.errors).forEach((err) => {
        if (!_chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, err) || err.error) {
          handleError(err);
        }
      });
      context.errors = sanitizeErrors(context.errors, serverMode);
    }
    let state = {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: serializeErrors(context.errors, serverMode)
    };
    let baseServerHandoff = {
      basename: build.basename,
      future: build.future,
      routeDiscovery: build.routeDiscovery,
      ssr: build.ssr,
      isSpaMode: isSpaMode2
    };
    let entryContext = {
      manifest: build.assets,
      routeModules: createEntryRouteModules(build.routes),
      staticHandlerContext: context,
      criticalCss,
      serverHandoffString: createServerHandoffString({
        ...baseServerHandoff,
        criticalCss
      }),
      serverHandoffStream: encodeViaTurboStream(
        state,
        request.signal,
        build.entry.module.streamTimeout,
        serverMode
      ),
      renderMeta: {},
      future: build.future,
      ssr: build.ssr,
      routeDiscovery: build.routeDiscovery,
      isSpaMode: isSpaMode2,
      serializeError: (err) => serializeError(err, serverMode)
    };
    let handleDocumentRequestFunction = build.entry.module.default;
    try {
      return await handleDocumentRequestFunction(
        request,
        context.statusCode,
        headers,
        entryContext,
        loadContext
      );
    } catch (error) {
      handleError(error);
      let errorForSecondRender = error;
      if (_chunkUVEQGZIHjs.isResponse.call(void 0, error)) {
        try {
          let data2 = await unwrapResponse(error);
          errorForSecondRender = new (0, _chunkUVEQGZIHjs.ErrorResponseImpl)(
            error.status,
            error.statusText,
            data2
          );
        } catch (e) {
        }
      }
      context = _chunkUVEQGZIHjs.getStaticContextFromError.call(void 0, 
        staticHandler.dataRoutes,
        context,
        errorForSecondRender
      );
      if (context.errors) {
        context.errors = sanitizeErrors(context.errors, serverMode);
      }
      let state2 = {
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: serializeErrors(context.errors, serverMode)
      };
      entryContext = {
        ...entryContext,
        staticHandlerContext: context,
        serverHandoffString: createServerHandoffString(baseServerHandoff),
        serverHandoffStream: encodeViaTurboStream(
          state2,
          request.signal,
          build.entry.module.streamTimeout,
          serverMode
        ),
        renderMeta: {}
      };
      try {
        return await handleDocumentRequestFunction(
          request,
          context.statusCode,
          headers,
          entryContext,
          loadContext
        );
      } catch (error2) {
        handleError(error2);
        return returnLastResortErrorResponse(error2, serverMode);
      }
    }
  }
}
async function handleResourceRequest(serverMode, build, staticHandler, routeId, request, loadContext, handleError) {
  try {
    let result = await staticHandler.queryRoute(request, {
      routeId,
      requestContext: loadContext,
      generateMiddlewareResponse: build.future.v8_middleware ? async (queryRoute) => {
        try {
          let innerResult = await queryRoute(request);
          return handleQueryRouteResult(innerResult);
        } catch (error) {
          return handleQueryRouteError(error);
        }
      } : void 0,
      unstable_normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    return handleQueryRouteResult(result);
  } catch (error) {
    return handleQueryRouteError(error);
  }
  function handleQueryRouteResult(result) {
    if (_chunkUVEQGZIHjs.isResponse.call(void 0, result)) {
      return result;
    }
    if (typeof result === "string") {
      return new Response(result);
    }
    return Response.json(result);
  }
  function handleQueryRouteError(error) {
    if (_chunkUVEQGZIHjs.isResponse.call(void 0, error)) {
      return error;
    }
    if (_chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, error)) {
      handleError(error);
      return errorResponseToJson(error, serverMode);
    }
    if (error instanceof Error && error.message === "Expected a response from queryRoute") {
      let newError = new Error(
        "Expected a Response to be returned from resource route handler"
      );
      handleError(newError);
      return returnLastResortErrorResponse(newError, serverMode);
    }
    handleError(error);
    return returnLastResortErrorResponse(error, serverMode);
  }
}
function errorResponseToJson(errorResponse, serverMode) {
  return Response.json(
    serializeError(
      // @ts-expect-error This is "private" from users but intended for internal use
      errorResponse.error || new Error("Unexpected Server Error"),
      serverMode
    ),
    {
      status: errorResponse.status,
      statusText: errorResponse.statusText
    }
  );
}
function returnLastResortErrorResponse(error, serverMode) {
  let message = "Unexpected Server Error";
  if (serverMode !== "production" /* Production */) {
    message += `

${String(error)}`;
  }
  return new Response(message, {
    status: 500,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
function unwrapResponse(response) {
  let contentType = response.headers.get("Content-Type");
  return contentType && /\bapplication\/json\b/.test(contentType) ? response.body == null ? null : response.json() : response.text();
}

// lib/server-runtime/sessions.ts
function flash(name) {
  return `__flash_${name}__`;
}
var createSession = (initialData = {}, id = "") => {
  let map = new Map(Object.entries(initialData));
  return {
    get id() {
      return id;
    },
    get data() {
      return Object.fromEntries(map);
    },
    has(name) {
      return map.has(name) || map.has(flash(name));
    },
    get(name) {
      if (map.has(name)) return map.get(name);
      let flashName = flash(name);
      if (map.has(flashName)) {
        let value = map.get(flashName);
        map.delete(flashName);
        return value;
      }
      return void 0;
    },
    set(name, value) {
      map.set(name, value);
    },
    flash(name, value) {
      map.set(flash(name), value);
    },
    unset(name) {
      map.delete(name);
    }
  };
};
var isSession = (object) => {
  return object != null && typeof object.id === "string" && typeof object.data !== "undefined" && typeof object.has === "function" && typeof object.get === "function" && typeof object.set === "function" && typeof object.flash === "function" && typeof object.unset === "function";
};
function createSessionStorage({
  cookie: cookieArg,
  createData,
  readData,
  updateData,
  deleteData
}) {
  let cookie = isCookie(cookieArg) ? cookieArg : createCookie(_optionalChain([cookieArg, 'optionalAccess', _23 => _23.name]) || "__session", cookieArg);
  warnOnceAboutSigningSessionCookie(cookie);
  return {
    async getSession(cookieHeader, options) {
      let id = cookieHeader && await cookie.parse(cookieHeader, options);
      let data2 = id && await readData(id);
      return createSession(data2 || {}, id || "");
    },
    async commitSession(session, options) {
      let { id, data: data2 } = session;
      let expires = _optionalChain([options, 'optionalAccess', _24 => _24.maxAge]) != null ? new Date(Date.now() + options.maxAge * 1e3) : _optionalChain([options, 'optionalAccess', _25 => _25.expires]) != null ? options.expires : cookie.expires;
      if (id) {
        await updateData(id, data2, expires);
      } else {
        id = await createData(data2, expires);
      }
      return cookie.serialize(id, options);
    },
    async destroySession(session, options) {
      await deleteData(session.id);
      return cookie.serialize("", {
        ...options,
        maxAge: void 0,
        expires: /* @__PURE__ */ new Date(0)
      });
    }
  };
}
function warnOnceAboutSigningSessionCookie(cookie) {
  _chunkUVEQGZIHjs.warnOnce.call(void 0, 
    cookie.isSigned,
    `The "${cookie.name}" cookie is not signed, but session cookies should be signed to prevent tampering on the client before they are sent back to the server. See https://reactrouter.com/explanation/sessions-and-cookies#signing-cookies for more information.`
  );
}

// lib/server-runtime/sessions/cookieStorage.ts
function createCookieSessionStorage({ cookie: cookieArg } = {}) {
  let cookie = isCookie(cookieArg) ? cookieArg : createCookie(_optionalChain([cookieArg, 'optionalAccess', _26 => _26.name]) || "__session", cookieArg);
  warnOnceAboutSigningSessionCookie(cookie);
  return {
    async getSession(cookieHeader, options) {
      return createSession(
        cookieHeader && await cookie.parse(cookieHeader, options) || {}
      );
    },
    async commitSession(session, options) {
      let serializedCookie = await cookie.serialize(session.data, options);
      if (serializedCookie.length > 4096) {
        throw new Error(
          "Cookie length will exceed browser maximum. Length: " + serializedCookie.length
        );
      }
      return serializedCookie;
    },
    async destroySession(_session, options) {
      return cookie.serialize("", {
        ...options,
        maxAge: void 0,
        expires: /* @__PURE__ */ new Date(0)
      });
    }
  };
}

// lib/server-runtime/sessions/memoryStorage.ts
function createMemorySessionStorage({ cookie } = {}) {
  let map = /* @__PURE__ */ new Map();
  return createSessionStorage({
    cookie,
    async createData(data2, expires) {
      let id = Math.random().toString(36).substring(2, 10);
      map.set(id, { data: data2, expires });
      return id;
    },
    async readData(id) {
      if (map.has(id)) {
        let { data: data2, expires } = map.get(id);
        if (!expires || expires > /* @__PURE__ */ new Date()) {
          return data2;
        }
        if (expires) map.delete(id);
      }
      return null;
    },
    async updateData(id, data2, expires) {
      map.set(id, { data: data2, expires });
    },
    async deleteData(id) {
      map.delete(id);
    }
  });
}

// lib/href.ts
function href(path, ...args) {
  let params = args[0];
  let result = trimTrailingSplat(path).replace(
    /\/:([\w-]+)(\?)?/g,
    // same regex as in .\router\utils.ts: compilePath().
    (_, param, questionMark) => {
      const isRequired = questionMark === void 0;
      const value = _optionalChain([params, 'optionalAccess', _27 => _27[param]]);
      if (isRequired && value === void 0) {
        throw new Error(
          `Path '${path}' requires param '${param}' but it was not provided`
        );
      }
      return value === void 0 ? "" : "/" + value;
    }
  );
  if (path.endsWith("*")) {
    const value = _optionalChain([params, 'optionalAccess', _28 => _28["*"]]);
    if (value !== void 0) {
      result += "/" + value;
    }
  }
  return result || "/";
}
function trimTrailingSplat(path) {
  let i = path.length - 1;
  let char = path[i];
  if (char !== "*" && char !== "/") return path;
  i--;
  for (; i >= 0; i--) {
    if (path[i] !== "/") break;
  }
  return path.slice(0, i + 1);
}

// lib/rsc/server.ssr.tsx


// lib/rsc/html-stream/server.ts
var encoder2 = new TextEncoder();
var trailer = "</body></html>";
function injectRSCPayload(rscStream) {
  let decoder = new TextDecoder();
  let resolveFlightDataPromise;
  let flightDataPromise = new Promise(
    (resolve) => resolveFlightDataPromise = resolve
  );
  let startedRSC = false;
  let buffered = [];
  let timeout = null;
  function flushBufferedChunks(controller) {
    for (let chunk of buffered) {
      let buf = decoder.decode(chunk, { stream: true });
      if (buf.endsWith(trailer)) {
        buf = buf.slice(0, -trailer.length);
      }
      controller.enqueue(encoder2.encode(buf));
    }
    buffered.length = 0;
    timeout = null;
  }
  return new TransformStream({
    transform(chunk, controller) {
      buffered.push(chunk);
      if (timeout) {
        return;
      }
      timeout = setTimeout(async () => {
        flushBufferedChunks(controller);
        if (!startedRSC) {
          startedRSC = true;
          writeRSCStream(rscStream, controller).catch((err) => controller.error(err)).then(resolveFlightDataPromise);
        }
      }, 0);
    },
    async flush(controller) {
      await flightDataPromise;
      if (timeout) {
        clearTimeout(timeout);
        flushBufferedChunks(controller);
      }
      controller.enqueue(encoder2.encode("</body></html>"));
    }
  });
}
async function writeRSCStream(rscStream, controller) {
  let decoder = new TextDecoder("utf-8", { fatal: true });
  const reader = rscStream.getReader();
  try {
    let read;
    while ((read = await reader.read()) && !read.done) {
      const chunk = read.value;
      try {
        writeChunk(
          JSON.stringify(decoder.decode(chunk, { stream: true })),
          controller
        );
      } catch (err) {
        let base64 = JSON.stringify(btoa(String.fromCodePoint(...chunk)));
        writeChunk(
          `Uint8Array.from(atob(${base64}), m => m.codePointAt(0))`,
          controller
        );
      }
    }
  } finally {
    reader.releaseLock();
  }
  let remaining = decoder.decode();
  if (remaining.length) {
    writeChunk(JSON.stringify(remaining), controller);
  }
}
function writeChunk(chunk, controller) {
  controller.enqueue(
    encoder2.encode(
      `<script>${escapeScript(
        `(self.__FLIGHT_DATA||=[]).push(${chunk})`
      )}</script>`
    )
  );
}
function escapeScript(script) {
  return script.replace(/<!--/g, "<\\!--").replace(/<\/(script)/gi, "</\\$1");
}

// lib/rsc/server.ssr.tsx
var defaultManifestPath = "/__manifest";
var REACT_USE = "use";
var useImpl = React3[REACT_USE];
function useSafe(promise) {
  if (useImpl) {
    return useImpl(promise);
  }
  throw new Error("React Router v7 requires React 19+ for RSC features.");
}
async function routeRSCServerRequest({
  request,
  serverResponse,
  createFromReadableStream,
  renderHTML,
  hydrate = true
}) {
  const url = new URL(request.url);
  const isDataRequest = isReactServerRequest(url);
  const respondWithRSCPayload = isDataRequest || isManifestRequest(url) || request.headers.has("rsc-action-id");
  if (respondWithRSCPayload || serverResponse.headers.get("React-Router-Resource") === "true") {
    return serverResponse;
  }
  if (!serverResponse.body) {
    throw new Error("Missing body in server response");
  }
  const detectRedirectResponse = serverResponse.clone();
  let serverResponseB = null;
  if (hydrate) {
    serverResponseB = serverResponse.clone();
  }
  const body = serverResponse.body;
  let buffer;
  let streamControllers = [];
  const createStream = () => {
    if (!buffer) {
      buffer = [];
      return body.pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            buffer.push(chunk);
            controller.enqueue(chunk);
            streamControllers.forEach((c) => c.enqueue(chunk));
          },
          flush() {
            streamControllers.forEach((c) => c.close());
            streamControllers = [];
          }
        })
      );
    }
    return new ReadableStream({
      start(controller) {
        buffer.forEach((chunk) => controller.enqueue(chunk));
        streamControllers.push(controller);
      }
    });
  };
  let deepestRenderedBoundaryId = null;
  const getPayload = () => {
    const payloadPromise = Promise.resolve(
      createFromReadableStream(createStream())
    );
    return Object.defineProperties(payloadPromise, {
      _deepestRenderedBoundaryId: {
        get() {
          return deepestRenderedBoundaryId;
        },
        set(boundaryId) {
          deepestRenderedBoundaryId = boundaryId;
        }
      },
      formState: {
        get() {
          return payloadPromise.then(
            (payload) => payload.type === "render" ? payload.formState : void 0
          );
        }
      }
    });
  };
  let renderRedirect;
  let renderError;
  try {
    if (!detectRedirectResponse.body) {
      throw new Error("Failed to clone server response");
    }
    const payload = await createFromReadableStream(
      detectRedirectResponse.body
    );
    if (serverResponse.status === _chunkUVEQGZIHjs.SINGLE_FETCH_REDIRECT_STATUS && payload.type === "redirect") {
      const headers2 = new Headers(serverResponse.headers);
      headers2.delete("Content-Encoding");
      headers2.delete("Content-Length");
      headers2.delete("Content-Type");
      headers2.delete("X-Remix-Response");
      headers2.set("Location", payload.location);
      return new Response(_optionalChain([serverResponseB, 'optionalAccess', _29 => _29.body]) || "", {
        headers: headers2,
        status: payload.status,
        statusText: serverResponse.statusText
      });
    }
    let reactHeaders = new Headers();
    let status = serverResponse.status;
    let statusText = serverResponse.statusText;
    let html = await renderHTML(getPayload, {
      onError(error) {
        if (typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
          renderRedirect = _chunkUVEQGZIHjs.decodeRedirectErrorDigest.call(void 0, error.digest);
          if (renderRedirect) {
            return error.digest;
          }
          let routeErrorResponse = _chunkUVEQGZIHjs.decodeRouteErrorResponseDigest.call(void 0, error.digest);
          if (routeErrorResponse) {
            renderError = routeErrorResponse;
            status = routeErrorResponse.status;
            statusText = routeErrorResponse.statusText;
            return error.digest;
          }
        }
      },
      onHeaders(headers2) {
        for (const [key, value] of headers2) {
          reactHeaders.append(key, value);
        }
      }
    });
    const headers = new Headers(reactHeaders);
    for (const [key, value] of serverResponse.headers) {
      headers.append(key, value);
    }
    headers.set("Content-Type", "text/html; charset=utf-8");
    if (renderRedirect) {
      headers.set("Location", renderRedirect.location);
      return new Response(html, {
        status: renderRedirect.status,
        headers
      });
    }
    const redirectTransform = new TransformStream({
      flush(controller) {
        if (renderRedirect) {
          controller.enqueue(
            new TextEncoder().encode(
              `<meta http-equiv="refresh" content="0;url=${_chunkUVEQGZIHjs.escapeHtml.call(void 0, renderRedirect.location)}"/>`
            )
          );
        }
      }
    });
    if (!hydrate) {
      return new Response(html.pipeThrough(redirectTransform), {
        status,
        statusText,
        headers
      });
    }
    if (!_optionalChain([serverResponseB, 'optionalAccess', _30 => _30.body])) {
      throw new Error("Failed to clone server response");
    }
    const body2 = html.pipeThrough(injectRSCPayload(serverResponseB.body)).pipeThrough(redirectTransform);
    return new Response(body2, {
      status,
      statusText,
      headers
    });
  } catch (reason) {
    if (reason instanceof Response) {
      return reason;
    }
    if (renderRedirect) {
      return new Response(`Redirect: ${renderRedirect.location}`, {
        status: renderRedirect.status,
        headers: {
          Location: renderRedirect.location
        }
      });
    }
    try {
      reason = _nullishCoalesce(renderError, () => ( reason));
      let [status, statusText] = _chunkUVEQGZIHjs.isRouteErrorResponse.call(void 0, reason) ? [reason.status, reason.statusText] : [500, ""];
      let retryRedirect;
      let reactHeaders = new Headers();
      const html = await renderHTML(
        () => {
          const decoded = Promise.resolve(
            createFromReadableStream(createStream())
          );
          const payloadPromise = decoded.then(
            (payload) => Object.assign(payload, {
              status,
              errors: deepestRenderedBoundaryId ? {
                [deepestRenderedBoundaryId]: reason
              } : {}
            })
          );
          return Object.defineProperties(payloadPromise, {
            _deepestRenderedBoundaryId: {
              get() {
                return deepestRenderedBoundaryId;
              },
              set(boundaryId) {
                deepestRenderedBoundaryId = boundaryId;
              }
            },
            formState: {
              get() {
                return payloadPromise.then(
                  (payload) => payload.type === "render" ? payload.formState : void 0
                );
              }
            }
          });
        },
        {
          onError(error) {
            if (typeof error === "object" && error && "digest" in error && typeof error.digest === "string") {
              retryRedirect = _chunkUVEQGZIHjs.decodeRedirectErrorDigest.call(void 0, error.digest);
              if (retryRedirect) {
                return error.digest;
              }
              let routeErrorResponse = _chunkUVEQGZIHjs.decodeRouteErrorResponseDigest.call(void 0, 
                error.digest
              );
              if (routeErrorResponse) {
                status = routeErrorResponse.status;
                statusText = routeErrorResponse.statusText;
                return error.digest;
              }
            }
          },
          onHeaders(headers2) {
            for (const [key, value] of headers2) {
              reactHeaders.append(key, value);
            }
          }
        }
      );
      const headers = new Headers(reactHeaders);
      for (const [key, value] of serverResponse.headers) {
        headers.append(key, value);
      }
      headers.set("Content-Type", "text/html; charset=utf-8");
      if (retryRedirect) {
        headers.set("Location", retryRedirect.location);
        return new Response(html, {
          status: retryRedirect.status,
          headers
        });
      }
      const retryRedirectTransform = new TransformStream({
        flush(controller) {
          if (retryRedirect) {
            controller.enqueue(
              new TextEncoder().encode(
                `<meta http-equiv="refresh" content="0;url=${_chunkUVEQGZIHjs.escapeHtml.call(void 0, retryRedirect.location)}"/>`
              )
            );
          }
        }
      });
      if (!hydrate) {
        return new Response(html.pipeThrough(retryRedirectTransform), {
          status,
          statusText,
          headers
        });
      }
      if (!_optionalChain([serverResponseB, 'optionalAccess', _31 => _31.body])) {
        throw new Error("Failed to clone server response");
      }
      const body2 = html.pipeThrough(injectRSCPayload(serverResponseB.body)).pipeThrough(retryRedirectTransform);
      return new Response(body2, {
        status,
        statusText,
        headers
      });
    } catch (e3) {
    }
    throw reason;
  }
}
function RSCStaticRouter({ getPayload }) {
  const decoded = getPayload();
  const payload = useSafe(decoded);
  if (payload.type === "redirect") {
    throw new Response(null, {
      status: payload.status,
      headers: {
        Location: payload.location
      }
    });
  }
  if (payload.type !== "render") return null;
  let patchedLoaderData = { ...payload.loaderData };
  for (const match of payload.matches) {
    if (_chunkUVEQGZIHjs.shouldHydrateRouteLoader.call(void 0, 
      match.id,
      match.clientLoader,
      match.hasLoader,
      false
    ) && (match.hydrateFallbackElement || !match.hasLoader)) {
      delete patchedLoaderData[match.id];
    }
  }
  const context = {
    get _deepestRenderedBoundaryId() {
      return _nullishCoalesce(decoded._deepestRenderedBoundaryId, () => ( null));
    },
    set _deepestRenderedBoundaryId(boundaryId) {
      decoded._deepestRenderedBoundaryId = boundaryId;
    },
    actionData: payload.actionData,
    actionHeaders: {},
    basename: payload.basename,
    errors: payload.errors,
    loaderData: patchedLoaderData,
    loaderHeaders: {},
    location: payload.location,
    statusCode: 200,
    matches: payload.matches.map((match) => ({
      params: match.params,
      pathname: match.pathname,
      pathnameBase: match.pathnameBase,
      route: {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        handle: match.handle,
        hasErrorBoundary: match.hasErrorBoundary,
        loader: match.hasLoader || !!match.clientLoader,
        index: match.index,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate
      }
    }))
  };
  const router = _chunkLIOP3ILMjs.createStaticRouter.call(void 0, 
    payload.matches.reduceRight((previous, match) => {
      const route = {
        id: match.id,
        action: match.hasAction || !!match.clientAction,
        element: match.element,
        errorElement: match.errorElement,
        handle: match.handle,
        hasErrorBoundary: !!match.errorElement,
        hydrateFallbackElement: match.hydrateFallbackElement,
        index: match.index,
        loader: match.hasLoader || !!match.clientLoader,
        path: match.path,
        shouldRevalidate: match.shouldRevalidate
      };
      if (previous.length > 0) {
        route.children = previous;
      }
      return [route];
    }, []),
    context
  );
  const frameworkContext = {
    future: {
      // These flags have no runtime impact so can always be false.  If we add
      // flags that drive runtime behavior they'll need to be proxied through.
      v8_middleware: false,
      unstable_subResourceIntegrity: false,
      unstable_trailingSlashAwareDataRequests: true,
      // always on for RSC
      unstable_passThroughRequests: true
      // always on for RSC
    },
    isSpaMode: false,
    ssr: true,
    criticalCss: "",
    manifest: {
      routes: {},
      version: "1",
      url: "",
      entry: {
        module: "",
        imports: []
      }
    },
    routeDiscovery: payload.routeDiscovery.mode === "initial" ? { mode: "initial", manifestPath: defaultManifestPath } : {
      mode: "lazy",
      manifestPath: payload.routeDiscovery.manifestPath || defaultManifestPath
    },
    routeModules: _chunk3SUPTI2Ujs.createRSCRouteModules.call(void 0, payload)
  };
  return /* @__PURE__ */ React3.createElement(_chunkUVEQGZIHjs.RSCRouterContext.Provider, { value: true }, /* @__PURE__ */ React3.createElement(_chunk3SUPTI2Ujs.RSCRouterGlobalErrorBoundary, { location: payload.location }, /* @__PURE__ */ React3.createElement(_chunkUVEQGZIHjs.FrameworkContext.Provider, { value: frameworkContext }, /* @__PURE__ */ React3.createElement(
    _chunkLIOP3ILMjs.StaticRouterProvider,
    {
      context,
      router,
      hydrate: false,
      nonce: payload.nonce
    }
  ))));
}
function isReactServerRequest(url) {
  return url.pathname.endsWith(".rsc");
}
function isManifestRequest(url) {
  return url.pathname.endsWith(".manifest");
}

// lib/dom/ssr/errors.ts
function deserializeErrors(errors) {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized = {};
  for (let [key, val] of entries) {
    if (val && val.__type === "RouteErrorResponse") {
      serialized[key] = new (0, _chunkUVEQGZIHjs.ErrorResponseImpl)(
        val.status,
        val.statusText,
        val.data,
        val.internal === true
      );
    } else if (val && val.__type === "Error") {
      if (val.__subType) {
        let ErrorConstructor = window[val.__subType];
        if (typeof ErrorConstructor === "function") {
          try {
            let error = new ErrorConstructor(val.message);
            error.stack = val.stack;
            serialized[key] = error;
          } catch (e) {
          }
        }
      }
      if (serialized[key] == null) {
        let error = new Error(val.message);
        error.stack = val.stack;
        serialized[key] = error;
      }
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}


































































































































exports.Await = _chunkUVEQGZIHjs.Await; exports.BrowserRouter = _chunkLIOP3ILMjs.BrowserRouter; exports.Form = _chunkLIOP3ILMjs.Form; exports.HashRouter = _chunkLIOP3ILMjs.HashRouter; exports.IDLE_BLOCKER = _chunkUVEQGZIHjs.IDLE_BLOCKER; exports.IDLE_FETCHER = _chunkUVEQGZIHjs.IDLE_FETCHER; exports.IDLE_NAVIGATION = _chunkUVEQGZIHjs.IDLE_NAVIGATION; exports.Link = _chunkLIOP3ILMjs.Link; exports.Links = _chunkUVEQGZIHjs.Links; exports.MemoryRouter = _chunkUVEQGZIHjs.MemoryRouter; exports.Meta = _chunkUVEQGZIHjs.Meta; exports.NavLink = _chunkLIOP3ILMjs.NavLink; exports.Navigate = _chunkUVEQGZIHjs.Navigate; exports.NavigationType = _chunkUVEQGZIHjs.Action; exports.Outlet = _chunkUVEQGZIHjs.Outlet; exports.PrefetchPageLinks = _chunkUVEQGZIHjs.PrefetchPageLinks; exports.Route = _chunkUVEQGZIHjs.Route; exports.Router = _chunkUVEQGZIHjs.Router; exports.RouterContextProvider = _chunkUVEQGZIHjs.RouterContextProvider; exports.RouterProvider = _chunkUVEQGZIHjs.RouterProvider; exports.Routes = _chunkUVEQGZIHjs.Routes; exports.Scripts = _chunkUVEQGZIHjs.Scripts; exports.ScrollRestoration = _chunkLIOP3ILMjs.ScrollRestoration; exports.ServerRouter = ServerRouter; exports.StaticRouter = _chunkLIOP3ILMjs.StaticRouter; exports.StaticRouterProvider = _chunkLIOP3ILMjs.StaticRouterProvider; exports.UNSAFE_AwaitContextProvider = _chunkUVEQGZIHjs.AwaitContextProvider; exports.UNSAFE_DataRouterContext = _chunkUVEQGZIHjs.DataRouterContext; exports.UNSAFE_DataRouterStateContext = _chunkUVEQGZIHjs.DataRouterStateContext; exports.UNSAFE_ErrorResponseImpl = _chunkUVEQGZIHjs.ErrorResponseImpl; exports.UNSAFE_FetchersContext = _chunkUVEQGZIHjs.FetchersContext; exports.UNSAFE_FrameworkContext = _chunkUVEQGZIHjs.FrameworkContext; exports.UNSAFE_LocationContext = _chunkUVEQGZIHjs.LocationContext; exports.UNSAFE_NavigationContext = _chunkUVEQGZIHjs.NavigationContext; exports.UNSAFE_RSCDefaultRootErrorBoundary = _chunk3SUPTI2Ujs.RSCDefaultRootErrorBoundary; exports.UNSAFE_RemixErrorBoundary = _chunkUVEQGZIHjs.RemixErrorBoundary; exports.UNSAFE_RouteContext = _chunkUVEQGZIHjs.RouteContext; exports.UNSAFE_ServerMode = ServerMode; exports.UNSAFE_SingleFetchRedirectSymbol = _chunkUVEQGZIHjs.SingleFetchRedirectSymbol; exports.UNSAFE_ViewTransitionContext = _chunkUVEQGZIHjs.ViewTransitionContext; exports.UNSAFE_WithComponentProps = _chunkUVEQGZIHjs.WithComponentProps; exports.UNSAFE_WithErrorBoundaryProps = _chunkUVEQGZIHjs.WithErrorBoundaryProps; exports.UNSAFE_WithHydrateFallbackProps = _chunkUVEQGZIHjs.WithHydrateFallbackProps; exports.UNSAFE_createBrowserHistory = _chunkUVEQGZIHjs.createBrowserHistory; exports.UNSAFE_createClientRoutes = _chunkUVEQGZIHjs.createClientRoutes; exports.UNSAFE_createClientRoutesWithHMRRevalidationOptOut = _chunkUVEQGZIHjs.createClientRoutesWithHMRRevalidationOptOut; exports.UNSAFE_createHashHistory = _chunkUVEQGZIHjs.createHashHistory; exports.UNSAFE_createMemoryHistory = _chunkUVEQGZIHjs.createMemoryHistory; exports.UNSAFE_createRouter = _chunkUVEQGZIHjs.createRouter; exports.UNSAFE_decodeViaTurboStream = _chunkUVEQGZIHjs.decodeViaTurboStream; exports.UNSAFE_deserializeErrors = deserializeErrors; exports.UNSAFE_getHydrationData = _chunk3SUPTI2Ujs.getHydrationData; exports.UNSAFE_getPatchRoutesOnNavigationFunction = _chunkUVEQGZIHjs.getPatchRoutesOnNavigationFunction; exports.UNSAFE_getTurboStreamSingleFetchDataStrategy = _chunkUVEQGZIHjs.getTurboStreamSingleFetchDataStrategy; exports.UNSAFE_hydrationRouteProperties = _chunkUVEQGZIHjs.hydrationRouteProperties; exports.UNSAFE_invariant = _chunkUVEQGZIHjs.invariant; exports.UNSAFE_mapRouteProperties = _chunkUVEQGZIHjs.mapRouteProperties; exports.UNSAFE_shouldHydrateRouteLoader = _chunkUVEQGZIHjs.shouldHydrateRouteLoader; exports.UNSAFE_useFogOFWarDiscovery = _chunkUVEQGZIHjs.useFogOFWarDiscovery; exports.UNSAFE_useScrollRestoration = _chunkLIOP3ILMjs.useScrollRestoration; exports.UNSAFE_withComponentProps = _chunkUVEQGZIHjs.withComponentProps; exports.UNSAFE_withErrorBoundaryProps = _chunkUVEQGZIHjs.withErrorBoundaryProps; exports.UNSAFE_withHydrateFallbackProps = _chunkUVEQGZIHjs.withHydrateFallbackProps; exports.createBrowserRouter = _chunkLIOP3ILMjs.createBrowserRouter; exports.createContext = _chunkUVEQGZIHjs.createContext; exports.createCookie = createCookie; exports.createCookieSessionStorage = createCookieSessionStorage; exports.createHashRouter = _chunkLIOP3ILMjs.createHashRouter; exports.createMemoryRouter = _chunkUVEQGZIHjs.createMemoryRouter; exports.createMemorySessionStorage = createMemorySessionStorage; exports.createPath = _chunkUVEQGZIHjs.createPath; exports.createRequestHandler = createRequestHandler; exports.createRoutesFromChildren = _chunkUVEQGZIHjs.createRoutesFromChildren; exports.createRoutesFromElements = _chunkUVEQGZIHjs.createRoutesFromElements; exports.createRoutesStub = createRoutesStub; exports.createSearchParams = _chunkLIOP3ILMjs.createSearchParams; exports.createSession = createSession; exports.createSessionStorage = createSessionStorage; exports.createStaticHandler = _chunkLIOP3ILMjs.createStaticHandler; exports.createStaticRouter = _chunkLIOP3ILMjs.createStaticRouter; exports.data = _chunkUVEQGZIHjs.data; exports.generatePath = _chunkUVEQGZIHjs.generatePath; exports.href = href; exports.isCookie = isCookie; exports.isRouteErrorResponse = _chunkUVEQGZIHjs.isRouteErrorResponse; exports.isSession = isSession; exports.matchPath = _chunkUVEQGZIHjs.matchPath; exports.matchRoutes = _chunkUVEQGZIHjs.matchRoutes; exports.parsePath = _chunkUVEQGZIHjs.parsePath; exports.redirect = _chunkUVEQGZIHjs.redirect; exports.redirectDocument = _chunkUVEQGZIHjs.redirectDocument; exports.renderMatches = _chunkUVEQGZIHjs.renderMatches; exports.replace = _chunkUVEQGZIHjs.replace; exports.resolvePath = _chunkUVEQGZIHjs.resolvePath; exports.unstable_HistoryRouter = _chunkLIOP3ILMjs.HistoryRouter; exports.unstable_RSCStaticRouter = RSCStaticRouter; exports.unstable_routeRSCServerRequest = routeRSCServerRequest; exports.unstable_setDevServerHooks = setDevServerHooks; exports.unstable_usePrompt = _chunkLIOP3ILMjs.usePrompt; exports.unstable_useRoute = _chunkUVEQGZIHjs.useRoute; exports.useActionData = _chunkUVEQGZIHjs.useActionData; exports.useAsyncError = _chunkUVEQGZIHjs.useAsyncError; exports.useAsyncValue = _chunkUVEQGZIHjs.useAsyncValue; exports.useBeforeUnload = _chunkLIOP3ILMjs.useBeforeUnload; exports.useBlocker = _chunkUVEQGZIHjs.useBlocker; exports.useFetcher = _chunkLIOP3ILMjs.useFetcher; exports.useFetchers = _chunkLIOP3ILMjs.useFetchers; exports.useFormAction = _chunkLIOP3ILMjs.useFormAction; exports.useHref = _chunkUVEQGZIHjs.useHref; exports.useInRouterContext = _chunkUVEQGZIHjs.useInRouterContext; exports.useLinkClickHandler = _chunkLIOP3ILMjs.useLinkClickHandler; exports.useLoaderData = _chunkUVEQGZIHjs.useLoaderData; exports.useLocation = _chunkUVEQGZIHjs.useLocation; exports.useMatch = _chunkUVEQGZIHjs.useMatch; exports.useMatches = _chunkUVEQGZIHjs.useMatches; exports.useNavigate = _chunkUVEQGZIHjs.useNavigate; exports.useNavigation = _chunkUVEQGZIHjs.useNavigation; exports.useNavigationType = _chunkUVEQGZIHjs.useNavigationType; exports.useOutlet = _chunkUVEQGZIHjs.useOutlet; exports.useOutletContext = _chunkUVEQGZIHjs.useOutletContext; exports.useParams = _chunkUVEQGZIHjs.useParams; exports.useResolvedPath = _chunkUVEQGZIHjs.useResolvedPath; exports.useRevalidator = _chunkUVEQGZIHjs.useRevalidator; exports.useRouteError = _chunkUVEQGZIHjs.useRouteError; exports.useRouteLoaderData = _chunkUVEQGZIHjs.useRouteLoaderData; exports.useRoutes = _chunkUVEQGZIHjs.useRoutes; exports.useSearchParams = _chunkLIOP3ILMjs.useSearchParams; exports.useSubmit = _chunkLIOP3ILMjs.useSubmit; exports.useViewTransitionState = _chunkLIOP3ILMjs.useViewTransitionState;

"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/**
 * react-router v7.17.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use client";





var _chunkPBLBZ3QUjs = require('./chunk-PBLBZ3QU.js');

























var _chunkPULC7NLKjs = require('./chunk-PULC7NLK.js');
















































































































var _chunkKFNXW4ALjs = require('./chunk-KFNXW4AL.js');

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
  let routes = _chunkKFNXW4ALjs.createServerRoutes.call(void 0, 
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
    if (route && manifestRoute && _chunkKFNXW4ALjs.shouldHydrateRouteLoader.call(void 0, 
      routeId,
      route.clientLoader,
      manifestRoute.hasLoader,
      context.isSpaMode
    ) && (route.HydrateFallback || !manifestRoute.hasLoader)) {
      delete context.staticHandlerContext.loaderData[routeId];
    }
  }
  let router = _chunkPULC7NLKjs.createStaticRouter.call(void 0, routes, context.staticHandlerContext, {
    branches: context.branches
  });
  return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
    _chunkKFNXW4ALjs.FrameworkContext.Provider,
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
    /* @__PURE__ */ React.createElement(_chunkKFNXW4ALjs.RemixErrorBoundary, { location: router.state.location }, /* @__PURE__ */ React.createElement(
      _chunkPULC7NLKjs.StaticRouterProvider,
      {
        router,
        context: context.staticHandlerContext,
        hydrate: false
      }
    ))
  ), context.serverHandoffStream ? /* @__PURE__ */ React.createElement(React.Suspense, null, /* @__PURE__ */ React.createElement(
    _chunkKFNXW4ALjs.StreamTransfer,
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
          v8_passThroughRequests: _optionalChain([future, 'optionalAccess', _2 => _2.v8_passThroughRequests]) === true,
          v8_middleware: _optionalChain([future, 'optionalAccess', _3 => _3.v8_middleware]) === true,
          v8_trailingSlashAwareDataRequests: _optionalChain([future, 'optionalAccess', _4 => _4.v8_trailingSlashAwareDataRequests]) === true
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
        _chunkKFNXW4ALjs.convertRoutesToDataRoutes.call(void 0, routes, (r) => r),
        _context !== void 0 ? _context : _optionalChain([future, 'optionalAccess', _5 => _5.v8_middleware]) ? new (0, _chunkKFNXW4ALjs.RouterContextProvider)() : {},
        frameworkContextRef.current.manifest,
        frameworkContextRef.current.routeModules
      );
      routerRef.current = _chunkKFNXW4ALjs.createMemoryRouter.call(void 0, patched, {
        initialEntries,
        initialIndex,
        hydrationData
      });
    }
    return /* @__PURE__ */ React2.createElement(_chunkKFNXW4ALjs.FrameworkContext.Provider, { value: frameworkContextRef.current }, /* @__PURE__ */ React2.createElement(_chunkKFNXW4ALjs.RouterProvider, { router: routerRef.current }));
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
      Component: route.Component ? _chunkKFNXW4ALjs.withComponentProps.call(void 0, route.Component) : void 0,
      HydrateFallback: route.HydrateFallback ? _chunkKFNXW4ALjs.withHydrateFallbackProps.call(void 0, route.HydrateFallback) : void 0,
      ErrorBoundary: route.ErrorBoundary ? _chunkKFNXW4ALjs.withErrorBoundaryProps.call(void 0, route.ErrorBoundary) : void 0,
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
      default: newRoute.Component || _chunkKFNXW4ALjs.Outlet,
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
  } catch (e) {
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
  } catch (e) {
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
  _chunkKFNXW4ALjs.warnOnce.call(void 0, 
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
    if (_chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, val)) {
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

// lib/server-runtime/invariant.ts
function invariant2(value, message) {
  if (value === false || value === null || typeof value === "undefined") {
    console.error(
      "The following error is a bug in React Router; please open an issue! https://github.com/remix-run/react-router/issues/new/choose"
    );
    throw new Error(message);
  }
}

// lib/server-runtime/routeMatching.ts
function matchServerRoutes(manifest, dataRoutes, branches, pathname, basename) {
  let matches = _chunkKFNXW4ALjs.matchRoutesImpl.call(void 0, 
    dataRoutes,
    pathname,
    _nullishCoalesce(basename, () => ( "/")),
    false,
    branches
  );
  if (!matches) return null;
  return matches.map((match) => {
    let route = manifest[match.route.id];
    invariant2(
      route,
      `Route with id "${match.route.id}" not found in manifest.`
    );
    return {
      params: match.params,
      pathname: match.pathname,
      route
    };
  });
}

// lib/server-runtime/data.ts
async function callRouteHandler(handler, args, future) {
  let result = await handler({
    request: future.v8_passThroughRequests ? args.request : stripRoutesParam(stripIndexParam(args.request)),
    url: args.url,
    params: args.params,
    context: args.context,
    pattern: args.pattern
  });
  if (_chunkKFNXW4ALjs.isDataWithResponseInit.call(void 0, result) && result.init && result.init.status && _chunkKFNXW4ALjs.isRedirectStatusCode.call(void 0, result.init.status)) {
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
      if (process.env.hasOwnProperty("IS_RR_BUILD_REQUEST") && process.env.IS_RR_BUILD_REQUEST === "yes") {
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
          let decoded = await _chunkKFNXW4ALjs.decodeViaTurboStream.call(void 0, stream, global);
          let data2 = decoded.value;
          if (data2 && _chunkKFNXW4ALjs.SingleFetchRedirectSymbol in data2) {
            let result = data2[_chunkKFNXW4ALjs.SingleFetchRedirectSymbol];
            let init = { status: result.status };
            if (result.reload) {
              throw _chunkKFNXW4ALjs.redirectDocument.call(void 0, result.redirect, init);
            } else if (result.replace) {
              throw _chunkKFNXW4ALjs.replace.call(void 0, result.redirect, init);
            } else {
              throw _chunkKFNXW4ALjs.redirect.call(void 0, result.redirect, init);
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
  return _chunkKFNXW4ALjs.escapeHtml.call(void 0, JSON.stringify(serverHandoff));
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
  let forwardedHostValue = _optionalChain([forwardedHostHeader, 'optionalAccess', _6 => _6.split, 'call', _7 => _7(","), 'access', _8 => _8[0], 'optionalAccess', _9 => _9.trim, 'call', _10 => _10()]);
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
  if (_optionalChain([future, 'optionalAccess', _11 => _11.v8_trailingSlashAwareDataRequests])) {
    if (pathname.endsWith("/_.data")) {
      pathname = pathname.replace(/_\.data$/, "");
    } else {
      pathname = pathname.replace(/\.data$/, "");
    }
  } else {
    if (_chunkKFNXW4ALjs.stripBasename.call(void 0, pathname, basename) === "/_root.data") {
      pathname = basename;
    } else if (pathname.endsWith(".data")) {
      pathname = pathname.replace(/\.data$/, "");
    }
    if (_chunkKFNXW4ALjs.stripBasename.call(void 0, pathname, basename) !== "/" && pathname.endsWith("/")) {
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
  ..._chunkKFNXW4ALjs.NO_BODY_STATUS_CODES,
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
    let handlerRequest = build.future.v8_passThroughRequests ? request : new Request(handlerUrl, {
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
      normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    return handleQueryResult(result);
  } catch (error) {
    return handleQueryError(error);
  }
  function handleQueryResult(result) {
    return _chunkKFNXW4ALjs.isResponse.call(void 0, result) ? result : staticContextToResponse(result);
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
    if (_chunkKFNXW4ALjs.isRedirectStatusCode.call(void 0, context.statusCode) && headers.has("Location")) {
      return new Response(null, { status: context.statusCode, headers });
    }
    if (context.errors) {
      Object.values(context.errors).forEach((err) => {
        if (!_chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, err) || err.error) {
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
    let handlerRequest = build.future.v8_passThroughRequests ? request : new Request(handlerUrl, {
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
      normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    return handleQueryResult(result);
  } catch (error) {
    return handleQueryError(error);
  }
  function handleQueryResult(result) {
    return _chunkKFNXW4ALjs.isResponse.call(void 0, result) ? result : staticContextToResponse(result);
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
    if (_chunkKFNXW4ALjs.isRedirectStatusCode.call(void 0, context.statusCode) && headers.has("Location")) {
      return new Response(null, { status: context.statusCode, headers });
    }
    if (context.errors) {
      Object.values(context.errors).forEach((err) => {
        if (!_chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, err) || err.error) {
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
    result: request.method === "GET" ? { [_chunkKFNXW4ALjs.SingleFetchRedirectSymbol]: redirect2 } : redirect2,
    headers,
    status: _chunkKFNXW4ALjs.SINGLE_FETCH_REDIRECT_STATUS
  });
}
function getSingleFetchRedirect(status, headers, basename) {
  let redirect2 = headers.get("Location");
  if (basename) {
    redirect2 = _chunkKFNXW4ALjs.stripBasename.call(void 0, redirect2, basename) || redirect2;
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
  return _chunkKFNXW4ALjs.encode.call(void 0, data2, {
    signal: controller.signal,
    onComplete: cleanupCallbacks,
    plugins: [
      (value) => {
        if (value instanceof Error) {
          let { name, message, stack } = serverMode === "production" /* Production */ ? sanitizeError(value, serverMode) : value;
          return ["SanitizedError", name, message, stack];
        }
        if (value instanceof _chunkKFNXW4ALjs.ErrorResponseImpl) {
          let { data: data3, status, statusText } = value;
          return ["ErrorResponse", data3, status, statusText];
        }
        if (value && typeof value === "object" && _chunkKFNXW4ALjs.SingleFetchRedirectSymbol in value) {
          return ["SingleFetchRedirect", value[_chunkKFNXW4ALjs.SingleFetchRedirectSymbol]];
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
  let dataRoutes = createStaticHandlerDataRoutes(build.routes, build.future);
  let serverMode = isServerMode(mode) ? mode : "production" /* Production */;
  let staticHandler = _chunkKFNXW4ALjs.createStaticHandler.call(void 0, dataRoutes, {
    basename: build.basename,
    instrumentations: build.entry.module.instrumentations,
    future: build.future
  });
  let errorHandler = build.entry.module.handleError || ((error, { request }) => {
    if (serverMode !== "test" /* Test */ && !request.signal.aborted) {
      console.error(
        // @ts-expect-error This is "private" from users but intended for internal use
        _chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, error) && error.error ? error.error : error
      );
    }
  });
  let requestHandler = async (request, initialContext) => {
    let params = {};
    let loadContext;
    let handleError = (error) => {
      if (mode === "development" /* Development */) {
        _optionalChain([getDevServerHooks, 'call', _12 => _12(), 'optionalAccess', _13 => _13.processRequestError, 'optionalCall', _14 => _14(error)]);
      }
      errorHandler(error, {
        context: loadContext,
        params,
        request
      });
    };
    if (build.future.v8_middleware) {
      if (initialContext && !(initialContext instanceof _chunkKFNXW4ALjs.RouterContextProvider)) {
        let error = new Error(
          "Invalid `context` value provided to `handleRequest`. When middleware is enabled you must return an instance of `RouterContextProvider` from your `getLoadContext` function."
        );
        handleError(error);
        return returnLastResortErrorResponse(error, serverMode);
      }
      loadContext = initialContext || new (0, _chunkKFNXW4ALjs.RouterContextProvider)();
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
        let strippedPath = _chunkKFNXW4ALjs.stripBasename.call(void 0, decodedPath, build.basename);
        if (strippedPath == null) {
          errorHandler(
            new (0, _chunkKFNXW4ALjs.ErrorResponseImpl)(
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
            new (0, _chunkKFNXW4ALjs.ErrorResponseImpl)(
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
    let manifestUrl = _chunkKFNXW4ALjs.getManifestPath.call(void 0, 
      build.routeDiscovery.manifestPath,
      build.basename
    );
    if (build.routeDiscovery.mode === "lazy" && requestUrl.pathname === manifestUrl) {
      try {
        let res = await handleManifestRequest(
          build,
          staticHandler.dataRoutes,
          staticHandler._internalRouteBranches,
          requestUrl
        );
        return res;
      } catch (e) {
        handleError(e);
        return new Response("Unknown Server Error", { status: 500 });
      }
    }
    let matches = matchServerRoutes(
      build.routes,
      staticHandler.dataRoutes,
      staticHandler._internalRouteBranches,
      normalizedPathname,
      build.basename
    );
    if (matches && matches.length > 0) {
      Object.assign(params, matches[0].params);
    }
    let response;
    if (requestUrl.pathname.endsWith(".data")) {
      response = await handleSingleFetchRequest(
        serverMode,
        build,
        staticHandler,
        request,
        normalizedPathname,
        loadContext,
        handleError
      );
      if (_chunkKFNXW4ALjs.isRedirectResponse.call(void 0, response)) {
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
          params: matches ? matches[0].params : {},
          request
        });
        if (_chunkKFNXW4ALjs.isRedirectResponse.call(void 0, response)) {
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
      } else if (mode === "development" /* Development */ && _optionalChain([getDevServerHooks, 'call', _15 => _15(), 'optionalAccess', _16 => _16.getCriticalCss])) {
        criticalCss = await _optionalChain([getDevServerHooks, 'call', _17 => _17(), 'optionalAccess', _18 => _18.getCriticalCss, 'optionalCall', _19 => _19(pathname)]);
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
  if (build.entry.module.instrumentations) {
    requestHandler = _chunkKFNXW4ALjs.instrumentHandler.call(void 0, 
      requestHandler,
      build.entry.module.instrumentations.map((i) => i.handler).filter(Boolean)
    );
  }
  return {
    serverMode,
    staticHandler,
    errorHandler,
    requestHandler
  };
}
var createRequestHandler = (build, mode) => {
  let _build;
  let serverMode;
  let staticHandler;
  let errorHandler;
  let _requestHandler;
  return async function requestHandler(request, initialContext) {
    _build = typeof build === "function" ? await build() : build;
    if (typeof build === "function") {
      let derived = derive(_build, mode);
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
      _requestHandler = derived.requestHandler;
    } else if (!serverMode || !staticHandler || !errorHandler || !_requestHandler) {
      let derived = derive(_build, mode);
      serverMode = derived.serverMode;
      staticHandler = derived.staticHandler;
      errorHandler = derived.errorHandler;
      _requestHandler = derived.requestHandler;
    }
    return _requestHandler(request, initialContext);
  };
};
async function handleManifestRequest(build, dataRoutes, branches, url) {
  if (build.assets.version !== url.searchParams.get("version")) {
    return new Response(null, {
      status: 204,
      headers: {
        "X-Remix-Reload-Document": "true"
      }
    });
  }
  if (url.toString().length > _chunkKFNXW4ALjs.URL_LIMIT) {
    return new Response(null, {
      statusText: "Bad Request",
      status: 400
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
      let matches = matchServerRoutes(
        build.routes,
        dataRoutes,
        branches,
        path,
        build.basename
      );
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
  let response = _chunkKFNXW4ALjs.isMutationMethod.call(void 0, request.method) ? await singleFetchAction(
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
    if (_chunkKFNXW4ALjs.isMutationMethod.call(void 0, request.method)) {
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
          if (!_chunkKFNXW4ALjs.isResponse.call(void 0, innerResult)) {
            innerResult = await renderHtml(innerResult, isSpaMode);
          }
          return innerResult;
        } catch (error) {
          handleError(error);
          return new Response(null, { status: 500 });
        }
      } : void 0,
      normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    if (!_chunkKFNXW4ALjs.isResponse.call(void 0, result)) {
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
        if (!_chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, err) || err.error) {
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
      branches: staticHandler._internalRouteBranches,
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
      if (_chunkKFNXW4ALjs.isResponse.call(void 0, error)) {
        try {
          let data2 = await unwrapResponse(error);
          errorForSecondRender = new (0, _chunkKFNXW4ALjs.ErrorResponseImpl)(
            error.status,
            error.statusText,
            data2
          );
        } catch (e) {
        }
      }
      context = _chunkKFNXW4ALjs.getStaticContextFromError.call(void 0, 
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
      normalizePath: (r) => getNormalizedPath(r, build.basename, build.future)
    });
    return handleQueryRouteResult(result);
  } catch (error) {
    return handleQueryRouteError(error);
  }
  function handleQueryRouteResult(result) {
    if (_chunkKFNXW4ALjs.isResponse.call(void 0, result)) {
      return result;
    }
    if (typeof result === "string") {
      return new Response(result);
    }
    return Response.json(result);
  }
  function handleQueryRouteError(error) {
    if (_chunkKFNXW4ALjs.isResponse.call(void 0, error)) {
      return error;
    }
    if (_chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, error)) {
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
  let cookie = isCookie(cookieArg) ? cookieArg : createCookie(_optionalChain([cookieArg, 'optionalAccess', _20 => _20.name]) || "__session", cookieArg);
  warnOnceAboutSigningSessionCookie(cookie);
  return {
    async getSession(cookieHeader, options) {
      let id = cookieHeader && await cookie.parse(cookieHeader, options);
      let data2 = id && await readData(id);
      return createSession(data2 || {}, id || "");
    },
    async commitSession(session, options) {
      let { id, data: data2 } = session;
      let expires = _optionalChain([options, 'optionalAccess', _21 => _21.maxAge]) != null ? new Date(Date.now() + options.maxAge * 1e3) : _optionalChain([options, 'optionalAccess', _22 => _22.expires]) != null ? options.expires : cookie.expires;
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
  _chunkKFNXW4ALjs.warnOnce.call(void 0, 
    cookie.isSigned,
    `The "${cookie.name}" cookie is not signed, but session cookies should be signed to prevent tampering on the client before they are sent back to the server. See https://reactrouter.com/explanation/sessions-and-cookies#signing-cookies for more information.`
  );
}

// lib/server-runtime/sessions/cookieStorage.ts
function createCookieSessionStorage({ cookie: cookieArg } = {}) {
  let cookie = isCookie(cookieArg) ? cookieArg : createCookie(_optionalChain([cookieArg, 'optionalAccess', _23 => _23.name]) || "__session", cookieArg);
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
      const value = _optionalChain([params, 'optionalAccess', _24 => _24[param]]);
      if (isRequired && value === void 0) {
        throw new Error(
          `Path '${path}' requires param '${param}' but it was not provided`
        );
      }
      return value === void 0 ? "" : "/" + value;
    }
  );
  if (path.endsWith("*")) {
    const value = _optionalChain([params, 'optionalAccess', _25 => _25["*"]]);
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
      } catch (e) {
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
    if (serverResponse.status === _chunkKFNXW4ALjs.SINGLE_FETCH_REDIRECT_STATUS && payload.type === "redirect") {
      const headers2 = new Headers(serverResponse.headers);
      headers2.delete("Content-Encoding");
      headers2.delete("Content-Length");
      headers2.delete("Content-Type");
      headers2.delete("X-Remix-Response");
      headers2.set("Location", payload.location);
      return new Response(_optionalChain([serverResponseB, 'optionalAccess', _26 => _26.body]) || "", {
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
          renderRedirect = _chunkKFNXW4ALjs.decodeRedirectErrorDigest.call(void 0, error.digest);
          if (renderRedirect) {
            return error.digest;
          }
          let routeErrorResponse = _chunkKFNXW4ALjs.decodeRouteErrorResponseDigest.call(void 0, error.digest);
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
              `<meta http-equiv="refresh" content="0;url=${_chunkKFNXW4ALjs.escapeHtml.call(void 0, renderRedirect.location)}"/>`
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
    if (!_optionalChain([serverResponseB, 'optionalAccess', _27 => _27.body])) {
      throw new Error("Failed to clone server response");
    }
    const body2 = html.pipeThrough(injectRSCPayload(serverResponseB.body)).pipeThrough(redirectTransform);
    return new Response(body2, {
      status,
      statusText,
      headers
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
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
      let normalizedError = _nullishCoalesce(renderError, () => ( error));
      let [status, statusText] = _chunkKFNXW4ALjs.isRouteErrorResponse.call(void 0, normalizedError) ? [normalizedError.status, normalizedError.statusText] : [500, ""];
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
                [deepestRenderedBoundaryId]: normalizedError
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
          onError(error2) {
            if (typeof error2 === "object" && error2 && "digest" in error2 && typeof error2.digest === "string") {
              retryRedirect = _chunkKFNXW4ALjs.decodeRedirectErrorDigest.call(void 0, error2.digest);
              if (retryRedirect) {
                return error2.digest;
              }
              let routeErrorResponse = _chunkKFNXW4ALjs.decodeRouteErrorResponseDigest.call(void 0, 
                error2.digest
              );
              if (routeErrorResponse) {
                status = routeErrorResponse.status;
                statusText = routeErrorResponse.statusText;
                return error2.digest;
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
                `<meta http-equiv="refresh" content="0;url=${_chunkKFNXW4ALjs.escapeHtml.call(void 0, retryRedirect.location)}"/>`
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
      if (!_optionalChain([serverResponseB, 'optionalAccess', _28 => _28.body])) {
        throw new Error("Failed to clone server response");
      }
      const body2 = html.pipeThrough(injectRSCPayload(serverResponseB.body)).pipeThrough(retryRedirectTransform);
      return new Response(body2, {
        status,
        statusText,
        headers
      });
    } catch (error2) {
    }
    throw error;
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
    if (_chunkKFNXW4ALjs.shouldHydrateRouteLoader.call(void 0, 
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
  const router = _chunkPULC7NLKjs.createStaticRouter.call(void 0, 
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
      v8_trailingSlashAwareDataRequests: true,
      // always on for RSC
      v8_passThroughRequests: true
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
    routeModules: _chunkPBLBZ3QUjs.createRSCRouteModules.call(void 0, payload)
  };
  return /* @__PURE__ */ React3.createElement(_chunkKFNXW4ALjs.RSCRouterContext.Provider, { value: true }, /* @__PURE__ */ React3.createElement(_chunkPBLBZ3QUjs.RSCRouterGlobalErrorBoundary, { location: payload.location }, /* @__PURE__ */ React3.createElement(_chunkKFNXW4ALjs.FrameworkContext.Provider, { value: frameworkContext }, /* @__PURE__ */ React3.createElement(
    _chunkPULC7NLKjs.StaticRouterProvider,
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
      serialized[key] = new (0, _chunkKFNXW4ALjs.ErrorResponseImpl)(
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



































































































































exports.Await = _chunkKFNXW4ALjs.Await; exports.BrowserRouter = _chunkPULC7NLKjs.BrowserRouter; exports.Form = _chunkPULC7NLKjs.Form; exports.HashRouter = _chunkPULC7NLKjs.HashRouter; exports.IDLE_BLOCKER = _chunkKFNXW4ALjs.IDLE_BLOCKER; exports.IDLE_FETCHER = _chunkKFNXW4ALjs.IDLE_FETCHER; exports.IDLE_NAVIGATION = _chunkKFNXW4ALjs.IDLE_NAVIGATION; exports.Link = _chunkPULC7NLKjs.Link; exports.Links = _chunkKFNXW4ALjs.Links; exports.MemoryRouter = _chunkKFNXW4ALjs.MemoryRouter; exports.Meta = _chunkKFNXW4ALjs.Meta; exports.NavLink = _chunkPULC7NLKjs.NavLink; exports.Navigate = _chunkKFNXW4ALjs.Navigate; exports.NavigationType = _chunkKFNXW4ALjs.Action; exports.Outlet = _chunkKFNXW4ALjs.Outlet; exports.PrefetchPageLinks = _chunkKFNXW4ALjs.PrefetchPageLinks; exports.Route = _chunkKFNXW4ALjs.Route; exports.Router = _chunkKFNXW4ALjs.Router; exports.RouterContextProvider = _chunkKFNXW4ALjs.RouterContextProvider; exports.RouterProvider = _chunkKFNXW4ALjs.RouterProvider; exports.Routes = _chunkKFNXW4ALjs.Routes; exports.Scripts = _chunkKFNXW4ALjs.Scripts; exports.ScrollRestoration = _chunkPULC7NLKjs.ScrollRestoration; exports.ServerRouter = ServerRouter; exports.StaticRouter = _chunkPULC7NLKjs.StaticRouter; exports.StaticRouterProvider = _chunkPULC7NLKjs.StaticRouterProvider; exports.UNSAFE_AwaitContextProvider = _chunkKFNXW4ALjs.AwaitContextProvider; exports.UNSAFE_DataRouterContext = _chunkKFNXW4ALjs.DataRouterContext; exports.UNSAFE_DataRouterStateContext = _chunkKFNXW4ALjs.DataRouterStateContext; exports.UNSAFE_ErrorResponseImpl = _chunkKFNXW4ALjs.ErrorResponseImpl; exports.UNSAFE_FetchersContext = _chunkKFNXW4ALjs.FetchersContext; exports.UNSAFE_FrameworkContext = _chunkKFNXW4ALjs.FrameworkContext; exports.UNSAFE_LocationContext = _chunkKFNXW4ALjs.LocationContext; exports.UNSAFE_NavigationContext = _chunkKFNXW4ALjs.NavigationContext; exports.UNSAFE_RSCDefaultRootErrorBoundary = _chunkPBLBZ3QUjs.RSCDefaultRootErrorBoundary; exports.UNSAFE_RemixErrorBoundary = _chunkKFNXW4ALjs.RemixErrorBoundary; exports.UNSAFE_RouteContext = _chunkKFNXW4ALjs.RouteContext; exports.UNSAFE_ServerMode = ServerMode; exports.UNSAFE_SingleFetchRedirectSymbol = _chunkKFNXW4ALjs.SingleFetchRedirectSymbol; exports.UNSAFE_ViewTransitionContext = _chunkKFNXW4ALjs.ViewTransitionContext; exports.UNSAFE_WithComponentProps = _chunkKFNXW4ALjs.WithComponentProps; exports.UNSAFE_WithErrorBoundaryProps = _chunkKFNXW4ALjs.WithErrorBoundaryProps; exports.UNSAFE_WithHydrateFallbackProps = _chunkKFNXW4ALjs.WithHydrateFallbackProps; exports.UNSAFE_createBrowserHistory = _chunkKFNXW4ALjs.createBrowserHistory; exports.UNSAFE_createClientRoutes = _chunkKFNXW4ALjs.createClientRoutes; exports.UNSAFE_createClientRoutesWithHMRRevalidationOptOut = _chunkKFNXW4ALjs.createClientRoutesWithHMRRevalidationOptOut; exports.UNSAFE_createHashHistory = _chunkKFNXW4ALjs.createHashHistory; exports.UNSAFE_createMemoryHistory = _chunkKFNXW4ALjs.createMemoryHistory; exports.UNSAFE_createRouter = _chunkKFNXW4ALjs.createRouter; exports.UNSAFE_decodeViaTurboStream = _chunkKFNXW4ALjs.decodeViaTurboStream; exports.UNSAFE_deserializeErrors = deserializeErrors; exports.UNSAFE_getHydrationData = _chunkPBLBZ3QUjs.getHydrationData; exports.UNSAFE_getPatchRoutesOnNavigationFunction = _chunkKFNXW4ALjs.getPatchRoutesOnNavigationFunction; exports.UNSAFE_getTurboStreamSingleFetchDataStrategy = _chunkKFNXW4ALjs.getTurboStreamSingleFetchDataStrategy; exports.UNSAFE_hydrationRouteProperties = _chunkKFNXW4ALjs.hydrationRouteProperties; exports.UNSAFE_invariant = _chunkKFNXW4ALjs.invariant; exports.UNSAFE_mapRouteProperties = _chunkKFNXW4ALjs.mapRouteProperties; exports.UNSAFE_shouldHydrateRouteLoader = _chunkKFNXW4ALjs.shouldHydrateRouteLoader; exports.UNSAFE_useFogOFWarDiscovery = _chunkKFNXW4ALjs.useFogOFWarDiscovery; exports.UNSAFE_useScrollRestoration = _chunkPULC7NLKjs.useScrollRestoration; exports.UNSAFE_withComponentProps = _chunkKFNXW4ALjs.withComponentProps; exports.UNSAFE_withErrorBoundaryProps = _chunkKFNXW4ALjs.withErrorBoundaryProps; exports.UNSAFE_withHydrateFallbackProps = _chunkKFNXW4ALjs.withHydrateFallbackProps; exports.createBrowserRouter = _chunkPULC7NLKjs.createBrowserRouter; exports.createContext = _chunkKFNXW4ALjs.createContext; exports.createCookie = createCookie; exports.createCookieSessionStorage = createCookieSessionStorage; exports.createHashRouter = _chunkPULC7NLKjs.createHashRouter; exports.createMemoryRouter = _chunkKFNXW4ALjs.createMemoryRouter; exports.createMemorySessionStorage = createMemorySessionStorage; exports.createPath = _chunkKFNXW4ALjs.createPath; exports.createRequestHandler = createRequestHandler; exports.createRoutesFromChildren = _chunkKFNXW4ALjs.createRoutesFromChildren; exports.createRoutesFromElements = _chunkKFNXW4ALjs.createRoutesFromElements; exports.createRoutesStub = createRoutesStub; exports.createSearchParams = _chunkPULC7NLKjs.createSearchParams; exports.createSession = createSession; exports.createSessionStorage = createSessionStorage; exports.createStaticHandler = _chunkPULC7NLKjs.createStaticHandler; exports.createStaticRouter = _chunkPULC7NLKjs.createStaticRouter; exports.data = _chunkKFNXW4ALjs.data; exports.generatePath = _chunkKFNXW4ALjs.generatePath; exports.href = href; exports.isCookie = isCookie; exports.isRouteErrorResponse = _chunkKFNXW4ALjs.isRouteErrorResponse; exports.isSession = isSession; exports.matchPath = _chunkKFNXW4ALjs.matchPath; exports.matchRoutes = _chunkKFNXW4ALjs.matchRoutes; exports.parsePath = _chunkKFNXW4ALjs.parsePath; exports.redirect = _chunkKFNXW4ALjs.redirect; exports.redirectDocument = _chunkKFNXW4ALjs.redirectDocument; exports.renderMatches = _chunkKFNXW4ALjs.renderMatches; exports.replace = _chunkKFNXW4ALjs.replace; exports.resolvePath = _chunkKFNXW4ALjs.resolvePath; exports.unstable_HistoryRouter = _chunkPULC7NLKjs.HistoryRouter; exports.unstable_RSCStaticRouter = RSCStaticRouter; exports.unstable_routeRSCServerRequest = routeRSCServerRequest; exports.unstable_setDevServerHooks = setDevServerHooks; exports.unstable_usePrompt = _chunkPULC7NLKjs.usePrompt; exports.unstable_useRoute = _chunkKFNXW4ALjs.useRoute; exports.unstable_useRouterState = _chunkKFNXW4ALjs.useRouterState; exports.useActionData = _chunkKFNXW4ALjs.useActionData; exports.useAsyncError = _chunkKFNXW4ALjs.useAsyncError; exports.useAsyncValue = _chunkKFNXW4ALjs.useAsyncValue; exports.useBeforeUnload = _chunkPULC7NLKjs.useBeforeUnload; exports.useBlocker = _chunkKFNXW4ALjs.useBlocker; exports.useFetcher = _chunkPULC7NLKjs.useFetcher; exports.useFetchers = _chunkPULC7NLKjs.useFetchers; exports.useFormAction = _chunkPULC7NLKjs.useFormAction; exports.useHref = _chunkKFNXW4ALjs.useHref; exports.useInRouterContext = _chunkKFNXW4ALjs.useInRouterContext; exports.useLinkClickHandler = _chunkPULC7NLKjs.useLinkClickHandler; exports.useLoaderData = _chunkKFNXW4ALjs.useLoaderData; exports.useLocation = _chunkKFNXW4ALjs.useLocation; exports.useMatch = _chunkKFNXW4ALjs.useMatch; exports.useMatches = _chunkKFNXW4ALjs.useMatches; exports.useNavigate = _chunkKFNXW4ALjs.useNavigate; exports.useNavigation = _chunkKFNXW4ALjs.useNavigation; exports.useNavigationType = _chunkKFNXW4ALjs.useNavigationType; exports.useOutlet = _chunkKFNXW4ALjs.useOutlet; exports.useOutletContext = _chunkKFNXW4ALjs.useOutletContext; exports.useParams = _chunkKFNXW4ALjs.useParams; exports.useResolvedPath = _chunkKFNXW4ALjs.useResolvedPath; exports.useRevalidator = _chunkKFNXW4ALjs.useRevalidator; exports.useRouteError = _chunkKFNXW4ALjs.useRouteError; exports.useRouteLoaderData = _chunkKFNXW4ALjs.useRouteLoaderData; exports.useRoutes = _chunkKFNXW4ALjs.useRoutes; exports.useSearchParams = _chunkPULC7NLKjs.useSearchParams; exports.useSubmit = _chunkPULC7NLKjs.useSubmit; exports.useViewTransitionState = _chunkPULC7NLKjs.useViewTransitionState;

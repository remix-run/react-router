// RSC APIs
export { matchRSCServerRequest as unstable_matchRSCServerRequest } from "./lib/rsc/server.rsc";

export type {
  DecodeActionFunction as unstable_DecodeActionFunction,
  DecodeFormStateFunction as unstable_DecodeFormStateFunction,
  DecodeReplyFunction as unstable_DecodeReplyFunction,
  LoadServerActionFunction as unstable_LoadServerActionFunction,
  ServerManifestPayload as unstable_ServerManifestPayload,
  ServerMatch as unstable_ServerMatch,
  ServerPayload as unstable_ServerPayload,
  ServerRenderPayload as unstable_ServerRenderPayload,
  RenderedRoute as ServerRouteManifest,
  ServerRouteMatch as unstable_ServerRouteMatch,
  ServerRouteObject as unstable_ServerRouteObject,
} from "./lib/rsc/server.rsc";

// RSC implementation of agnostic APIs
export { redirect, redirectDocument, replace } from "./lib/rsc/server.rsc";

// Client references
export {
  Await,
  BrowserRouter,
  Form,
  HashRouter,
  Link,
  Links,
  MemoryRouter,
  Meta,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Router,
  RouterProvider,
  Routes,
  ScrollRestoration,
  StaticRouter,
  StaticRouterProvider,
  unstable_HistoryRouter,
} from "react-router/internal/react-server-client";

// Shared implementation of agnostic APIs
export { createStaticHandler } from "./lib/router/router";
export { data, matchRoutes, unstable_createContext } from "./lib/router/utils";

export { createCookie, isCookie } from "./lib/server-runtime/cookies";
export {
  createSession,
  createSessionStorage,
  isSession,
} from "./lib/server-runtime/sessions";
export { createCookieSessionStorage } from "./lib/server-runtime/sessions/cookieStorage";
export { createMemorySessionStorage } from "./lib/server-runtime/sessions/memoryStorage";

export type {
  unstable_MiddlewareFunction,
  unstable_MiddlewareNextFunction,
  unstable_RouterContext,
  unstable_RouterContextProvider,
} from "./lib/router/utils";

export type {
  Cookie,
  CookieOptions,
  CookieParseOptions,
  CookieSerializeOptions,
  CookieSignatureOptions,
  IsCookieFunction,
} from "./lib/server-runtime/cookies";
export type {
  IsSessionFunction,
  Session,
  SessionData,
  SessionIdStorageStrategy,
  SessionStorage,
  FlashSessionData,
} from "./lib/server-runtime/sessions";

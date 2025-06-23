export { createStaticHandler } from "./lib/router/router";
export {
  data,
  matchRoutes,
  redirect,
  redirectDocument,
  replace,
  unstable_createContext,
} from "./lib/router/utils";
export { createCookie, isCookie } from "./lib/server-runtime/cookies";
export {
  createSession,
  createSessionStorage,
  isSession,
} from "./lib/server-runtime/sessions";
export { createCookieSessionStorage } from "./lib/server-runtime/sessions/cookieStorage";
export { createMemorySessionStorage } from "./lib/server-runtime/sessions/memoryStorage";

// "use client" re-exports
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

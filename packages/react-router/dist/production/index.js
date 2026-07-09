/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
"use client";
import { Action, createBrowserHistory, createHashHistory, createMemoryHistory, createPath, invariant, parsePath } from "./lib/router/history.js";
import { ErrorResponseImpl, RouterContextProvider, createContext, data, defaultMapRouteProperties, generatePath, isRouteErrorResponse, matchPath, matchRoutes, redirect, redirectDocument, replace, resolvePath } from "./lib/router/utils.js";
import { IDLE_BLOCKER, IDLE_FETCHER, IDLE_NAVIGATION, createRouter, createStaticHandler } from "./lib/router/router.js";
import { AwaitContextProvider, DataRouterContext, DataRouterStateContext, FetchersContext, LocationContext, NavigationContext, RouteContext, ViewTransitionContext } from "./lib/context.js";
import { useActionData, useAsyncError, useAsyncValue, useBlocker, useHref, useInRouterContext, useLoaderData, useLocation, useMatch, useMatches, useNavigate, useNavigation, useNavigationType, useOutlet, useOutletContext, useParams, useResolvedPath, useRevalidator, useRoute, useRouteError, useRouteLoaderData, useRouterState, useRoutes } from "./lib/hooks.js";
import { Await, MemoryRouter, Navigate, Outlet, Route, Router, RouterProvider, Routes, WithComponentProps, WithErrorBoundaryProps, WithHydrateFallbackProps, createMemoryRouter, createRoutesFromChildren, createRoutesFromElements, hydrationRouteProperties, renderMatches, withComponentProps, withErrorBoundaryProps, withHydrateFallbackProps } from "./lib/components.js";
import { createSearchParams } from "./lib/dom/dom.js";
import { SingleFetchRedirectSymbol, decodeViaTurboStream, getTurboStreamSingleFetchDataStrategy } from "./lib/dom/ssr/single-fetch.js";
import { RemixErrorBoundary } from "./lib/dom/ssr/errorBoundaries.js";
import { createClientRoutes, createClientRoutesWithHMRRevalidationOptOut, shouldHydrateRouteLoader } from "./lib/dom/ssr/routes.js";
import { getPatchRoutesOnNavigationFunction, useFogOFWarDiscovery } from "./lib/dom/ssr/fog-of-war.js";
import { FrameworkContext, Links, Meta, PrefetchPageLinks, Scripts } from "./lib/dom/ssr/components.js";
import { BrowserRouter, Form, HashRouter, HistoryRouter, Link, NavLink, ScrollRestoration, createBrowserRouter, createHashRouter, useBeforeUnload, useFetcher, useFetchers, useFormAction, useLinkClickHandler, usePrompt, useScrollRestoration, useSearchParams, useSubmit, useViewTransitionState } from "./lib/dom/lib.js";
import { StaticRouter, StaticRouterProvider, createStaticRouter } from "./lib/dom/server.js";
import { ServerRouter } from "./lib/dom/ssr/server.js";
import { createRoutesStub } from "./lib/dom/ssr/routes-test-stub.js";
import { createCookie, isCookie } from "./lib/server-runtime/cookies.js";
import { ServerMode } from "./lib/server-runtime/mode.js";
import { setDevServerHooks } from "./lib/server-runtime/dev.js";
import { createRequestHandler } from "./lib/server-runtime/server.js";
import { createSession, createSessionStorage, isSession } from "./lib/server-runtime/sessions.js";
import { createCookieSessionStorage } from "./lib/server-runtime/sessions/cookieStorage.js";
import { createMemorySessionStorage } from "./lib/server-runtime/sessions/memoryStorage.js";
import { href } from "./lib/href.js";
import { RSCDefaultRootErrorBoundary } from "./lib/rsc/errorBoundaries.js";
import { RSCStaticRouter, routeRSCServerRequest } from "./lib/rsc/server.ssr.js";
import { getHydrationData } from "./lib/dom/ssr/hydration.js";
//#region index.ts
/**
* @module index
* @mergeModuleWith react-router
*/
//#endregion
export { Await, BrowserRouter, Form, HashRouter, IDLE_BLOCKER, IDLE_FETCHER, IDLE_NAVIGATION, Link, Links, MemoryRouter, Meta, NavLink, Navigate, Action as NavigationType, Outlet, PrefetchPageLinks, Route, Router, RouterContextProvider, RouterProvider, Routes, Scripts, ScrollRestoration, ServerRouter, StaticRouter, StaticRouterProvider, AwaitContextProvider as UNSAFE_AwaitContextProvider, DataRouterContext as UNSAFE_DataRouterContext, DataRouterStateContext as UNSAFE_DataRouterStateContext, ErrorResponseImpl as UNSAFE_ErrorResponseImpl, FetchersContext as UNSAFE_FetchersContext, FrameworkContext as UNSAFE_FrameworkContext, LocationContext as UNSAFE_LocationContext, NavigationContext as UNSAFE_NavigationContext, RSCDefaultRootErrorBoundary as UNSAFE_RSCDefaultRootErrorBoundary, RemixErrorBoundary as UNSAFE_RemixErrorBoundary, RouteContext as UNSAFE_RouteContext, ServerMode as UNSAFE_ServerMode, SingleFetchRedirectSymbol as UNSAFE_SingleFetchRedirectSymbol, ViewTransitionContext as UNSAFE_ViewTransitionContext, WithComponentProps as UNSAFE_WithComponentProps, WithErrorBoundaryProps as UNSAFE_WithErrorBoundaryProps, WithHydrateFallbackProps as UNSAFE_WithHydrateFallbackProps, createBrowserHistory as UNSAFE_createBrowserHistory, createClientRoutes as UNSAFE_createClientRoutes, createClientRoutesWithHMRRevalidationOptOut as UNSAFE_createClientRoutesWithHMRRevalidationOptOut, createHashHistory as UNSAFE_createHashHistory, createMemoryHistory as UNSAFE_createMemoryHistory, createRouter as UNSAFE_createRouter, decodeViaTurboStream as UNSAFE_decodeViaTurboStream, defaultMapRouteProperties as UNSAFE_defaultMapRouteProperties, getHydrationData as UNSAFE_getHydrationData, getPatchRoutesOnNavigationFunction as UNSAFE_getPatchRoutesOnNavigationFunction, getTurboStreamSingleFetchDataStrategy as UNSAFE_getTurboStreamSingleFetchDataStrategy, hydrationRouteProperties as UNSAFE_hydrationRouteProperties, invariant as UNSAFE_invariant, shouldHydrateRouteLoader as UNSAFE_shouldHydrateRouteLoader, useFogOFWarDiscovery as UNSAFE_useFogOFWarDiscovery, useScrollRestoration as UNSAFE_useScrollRestoration, withComponentProps as UNSAFE_withComponentProps, withErrorBoundaryProps as UNSAFE_withErrorBoundaryProps, withHydrateFallbackProps as UNSAFE_withHydrateFallbackProps, createBrowserRouter, createContext, createCookie, createCookieSessionStorage, createHashRouter, createMemoryRouter, createMemorySessionStorage, createPath, createRequestHandler, createRoutesFromChildren, createRoutesFromElements, createRoutesStub, createSearchParams, createSession, createSessionStorage, createStaticHandler, createStaticRouter, data, generatePath, href, isCookie, isRouteErrorResponse, isSession, matchPath, matchRoutes, parsePath, redirect, redirectDocument, renderMatches, replace, resolvePath, HistoryRouter as unstable_HistoryRouter, RSCStaticRouter as unstable_RSCStaticRouter, routeRSCServerRequest as unstable_routeRSCServerRequest, setDevServerHooks as unstable_setDevServerHooks, usePrompt as unstable_usePrompt, useRoute as unstable_useRoute, useRouterState as unstable_useRouterState, useActionData, useAsyncError, useAsyncValue, useBeforeUnload, useBlocker, useFetcher, useFetchers, useFormAction, useHref, useInRouterContext, useLinkClickHandler, useLoaderData, useLocation, useMatch, useMatches, useNavigate, useNavigation, useNavigationType, useOutlet, useOutletContext, useParams, useResolvedPath, useRevalidator, useRouteError, useRouteLoaderData, useRoutes, useSearchParams, useSubmit, useViewTransitionState };

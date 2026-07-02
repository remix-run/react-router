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
import { AwaitContextProvider } from "./lib/context.js";
import { MemoryRouter, Navigate, Outlet, Route, Router, RouterProvider, Routes, WithComponentProps, WithErrorBoundaryProps, WithHydrateFallbackProps } from "./lib/components.js";
import { Links, Meta } from "./lib/dom/ssr/components.js";
import { BrowserRouter, Form, HashRouter, HistoryRouter, Link, NavLink, ScrollRestoration } from "./lib/dom/lib.js";
import { StaticRouter, StaticRouterProvider } from "./lib/dom/server.js";
export { BrowserRouter, Form, HashRouter, Link, Links, MemoryRouter, Meta, NavLink, Navigate, Outlet, Route, Router, RouterProvider, Routes, ScrollRestoration, StaticRouter, StaticRouterProvider, AwaitContextProvider as UNSAFE_AwaitContextProvider, WithComponentProps as UNSAFE_WithComponentProps, WithErrorBoundaryProps as UNSAFE_WithErrorBoundaryProps, WithHydrateFallbackProps as UNSAFE_WithHydrateFallbackProps, HistoryRouter as unstable_HistoryRouter };

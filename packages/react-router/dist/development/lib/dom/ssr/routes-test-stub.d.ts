
import { InitialEntry } from "../../router/history.js";
import { ActionFunction, IndexRouteObject, LoaderFunction, NonIndexRouteObject, RouterContextProvider } from "../../router/utils.js";
import { HydrationState } from "../../router/router.js";
import { LinksFunction, MetaFunction } from "./routeModules.js";
import { FutureConfig } from "./entry.js";
import * as React$1 from "react";

//#region lib/dom/ssr/routes-test-stub.d.ts
interface StubRouteExtensions {
  Component?: React$1.ComponentType<any>;
  HydrateFallback?: React$1.ComponentType<any>;
  ErrorBoundary?: React$1.ComponentType<any>;
  loader?: LoaderFunction;
  action?: ActionFunction;
  children?: StubRouteObject[];
  meta?: MetaFunction;
  links?: LinksFunction;
}
interface StubIndexRouteObject extends Omit<IndexRouteObject, "Component" | "HydrateFallback" | "ErrorBoundary" | "loader" | "action" | "element" | "errorElement" | "children">, StubRouteExtensions {}
interface StubNonIndexRouteObject extends Omit<NonIndexRouteObject, "Component" | "HydrateFallback" | "ErrorBoundary" | "loader" | "action" | "element" | "errorElement" | "children">, StubRouteExtensions {}
type StubRouteObject = StubIndexRouteObject | StubNonIndexRouteObject;
interface RoutesTestStubProps {
  /**
   *  The initial entries in the history stack. This allows you to start a test with
   *  multiple locations already in the history stack (for testing a back navigation, etc.)
   *  The test will default to the last entry in initialEntries if no initialIndex is provided.
   *  e.g. initialEntries={["/home", "/about", "/contact"]}
   */
  initialEntries?: InitialEntry[];
  /**
   * The initial index in the history stack to render. This allows you to start a test at a specific entry.
   * It defaults to the last entry in initialEntries.
   * e.g.
   *   initialEntries: ["/", "/events/123"]
   *   initialIndex: 1 // start at "/events/123"
   */
  initialIndex?: number;
  /**
   *  Used to set the route's initial loader and action data.
   *  e.g. hydrationData={{
   *   loaderData: { "/contact": { locale: "en-US" } },
   *   actionData: { "/login": { errors: { email: "invalid email" } }}
   *  }}
   */
  hydrationData?: HydrationState;
  /**
   * Future flags mimicking the settings in react-router.config.ts
   */
  future?: Partial<FutureConfig>;
}
/**
 * @category Utils
 */
declare function createRoutesStub(routes: StubRouteObject[], _context?: RouterContextProvider): ({
  initialEntries,
  initialIndex,
  hydrationData,
  future
}: RoutesTestStubProps) => React$1.JSX.Element;
//#endregion
export { RoutesTestStubProps, createRoutesStub };
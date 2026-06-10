
import { Action, Location, Path, To } from "./router/history.js";
import { ParamParseKey, Params, PathMatch, PathPattern, RouteObject, UIMatch } from "./router/utils.js";
import { Blocker, BlockerFunction, NavigationStates, RelativeRoutingType, Router } from "./router/router.js";
import { NavigateOptions } from "./context.js";
import { RouteModules } from "./types/register.js";
import { GetActionData, GetLoaderData, SerializeFrom } from "./types/route-data.js";
import * as React$1 from "react";

//#region lib/hooks.d.ts
/**
 * Resolves a URL against the current {@link Location}.
 *
 * @example
 * import { useHref } from "react-router";
 *
 * function SomeComponent() {
 *   let href = useHref("some/where");
 *   // "/resolved/some/where"
 * }
 *
 * @public
 * @category Hooks
 * @param to The path to resolve
 * @param options Options
 * @param options.relative Defaults to `"route"` so routing is relative to the
 * route tree.
 * Set to `"path"` to make relative routing operate against path segments.
 * @returns The resolved href string
 */
declare function useHref(to: To, {
  relative
}?: {
  relative?: RelativeRoutingType;
}): string;
/**
 * Returns `true` if this component is a descendant of a {@link Router}, useful
 * to ensure a component is used within a {@link Router}.
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns Whether the component is within a {@link Router} context
 */
declare function useInRouterContext(): boolean;
/**
 * Returns the current {@link Location}. This can be useful if you'd like to
 * perform some side effect whenever it changes.
 *
 * @example
 * import * as React from 'react'
 * import { useLocation } from 'react-router'
 *
 * function SomeComponent() {
 *   let location = useLocation()
 *
 *   React.useEffect(() => {
 *     // Google Analytics
 *     ga('send', 'pageview')
 *   }, [location]);
 *
 *   return (
 *     // ...
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @returns The current {@link Location} object
 */
declare function useLocation(): Location;
/**
 * Returns the current {@link Navigation} action which describes how the router
 * came to the current {@link Location}, either by a pop, push, or replace on
 * the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack.
 *
 * @public
 * @category Hooks
 * @returns The current {@link NavigationType} (`"POP"`, `"PUSH"`, or `"REPLACE"`)
 */
declare function useNavigationType(): Action;
/**
 * Returns a {@link PathMatch} object if the given pattern matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * {@link NavLink | `<NavLink>`}.
 *
 * @public
 * @category Hooks
 * @param pattern The pattern to match against the current {@link Location}
 * @returns The path match object if the pattern matches, `null` otherwise
 */
declare function useMatch<Path extends string>(pattern: PathPattern<Path> | Path): PathMatch<ParamParseKey<Path>> | null;
/**
 * The interface for the `navigate` function returned from {@link useNavigate}.
 */
interface NavigateFunction {
  (to: To, options?: NavigateOptions): void | Promise<void>;
  (delta: number): void | Promise<void>;
}
/**
 * Returns a function that lets you navigate programmatically in the browser in
 * response to user interactions or effects.
 *
 * It's often better to use {@link redirect} in [`action`](../../start/framework/route-module#action)/[`loader`](../../start/framework/route-module#loader)
 * functions than this hook.
 *
 * The returned function signature is `navigate(to, options?)`/`navigate(delta)` where:
 *
 * * `to` can be a string path, a {@link To} object, or a number (delta)
 * * `options` contains options for modifying the navigation
 *   * These options work in all modes (Framework, Data, and Declarative):
 *     * `relative`: `"route"` or `"path"` to control relative routing logic
 *     * `replace`: Replace the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack
 *     * `state`: Optional [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state) to include with the new {@link Location}
 *   * These options only work in Framework and Data modes:
 *     * `flushSync`: Wrap the DOM updates in [`ReactDom.flushSync`](https://react.dev/reference/react-dom/flushSync)
 *     * `preventScrollReset`: Do not scroll back to the top of the page after navigation
 *     * `viewTransition`: Enable [`document.startViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) for this navigation
 *
 * @example
 * import { useNavigate } from "react-router";
 *
 * function SomeComponent() {
 *   let navigate = useNavigate();
 *   return (
 *     <button onClick={() => navigate(-1)}>
 *       Go Back
 *     </button>
 *   );
 * }
 *
 * @additionalExamples
 * ### Navigate to another path
 *
 * ```tsx
 * navigate("/some/route");
 * navigate("/some/route?search=param");
 * ```
 *
 * ### Navigate with a {@link To} object
 *
 * All properties are optional.
 *
 * ```tsx
 * navigate({
 *   pathname: "/some/route",
 *   search: "?search=param",
 *   hash: "#hash",
 *   state: { some: "state" },
 * });
 * ```
 *
 * If you use `state`, that will be available on the {@link Location} object on
 * the next page. Access it with `useLocation().state` (see {@link useLocation}).
 *
 * ### Navigate back or forward in the history stack
 *
 * ```tsx
 * // back
 * // often used to close modals
 * navigate(-1);
 *
 * // forward
 * // often used in a multistep wizard workflows
 * navigate(1);
 * ```
 *
 * Be cautious with `navigate(number)`. If your application can load up to a
 * route that has a button that tries to navigate forward/back, there may not be
 * a [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * entry to go back or forward to, or it can go somewhere you don't expect
 * (like a different domain).
 *
 * Only use this if you're sure they will have an entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack to navigate to.
 *
 * ### Replace the current entry in the history stack
 *
 * This will remove the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack, replacing it with a new one, similar to a server side redirect.
 *
 * ```tsx
 * navigate("/some/route", { replace: true });
 * ```
 *
 * ### Prevent Scroll Reset
 *
 * [MODES: framework, data]
 *
 * <br/>
 * <br/>
 *
 * To prevent {@link ScrollRestoration | `<ScrollRestoration>`} from resetting
 * the scroll position, use the `preventScrollReset` option.
 *
 * ```tsx
 * navigate("?some-tab=1", { preventScrollReset: true });
 * ```
 *
 * For example, if you have a tab interface connected to search params in the
 * middle of a page, and you don't want it to scroll to the top when a tab is
 * clicked.
 *
 * ### Return Type Augmentation
 *
 * Internally, `useNavigate` uses a separate implementation when you are in
 * Declarative mode versus Data/Framework mode - the primary difference being
 * that the latter is able to return a stable reference that does not change
 * identity across navigations. The implementation in Data/Framework mode also
 * returns a [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
 * that resolves when the navigation is completed. This means the return type of
 * `useNavigate` is `void | Promise<void>`. This is accurate, but can lead to
 * some red squigglies based on the union in the return value:
 *
 * - If you're using `typescript-eslint`, you may see errors from
 *   [`@typescript-eslint/no-floating-promises`](https://typescript-eslint.io/rules/no-floating-promises)
 * - In Framework/Data mode, `React.use(navigate())` will show a false-positive
 *   `Argument of type 'void | Promise<void>' is not assignable to parameter of
 *   type 'Usable<void>'` error
 *
 * The easiest way to work around these issues is to augment the type based on the
 * router you're using:
 *
 * ```ts
 * // If using <BrowserRouter>
 * declare module "react-router" {
 *   interface NavigateFunction {
 *     (to: To, options?: NavigateOptions): void;
 *     (delta: number): void;
 *   }
 * }
 *
 * // If using <RouterProvider> or Framework mode
 * declare module "react-router" {
 *   interface NavigateFunction {
 *     (to: To, options?: NavigateOptions): Promise<void>;
 *     (delta: number): Promise<void>;
 *   }
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @returns A navigate function for programmatic navigation
 */
declare function useNavigate(): NavigateFunction;
/**
 * Returns the parent route {@link Outlet | `<Outlet context>`}.
 *
 * Often parent routes manage state or other values you want shared with child
 * routes. You can create your own [context provider](https://react.dev/learn/passing-data-deeply-with-context)
 * if you like, but this is such a common situation that it's built-into
 * {@link Outlet | `<Outlet>`}.
 *
 * ```tsx
 * // Parent route
 * function Parent() {
 *   const [count, setCount] = React.useState(0);
 *   return <Outlet context={[count, setCount]} />;
 * }
 * ```
 *
 * ```tsx
 * // Child route
 * import { useOutletContext } from "react-router";
 *
 * function Child() {
 *   const [count, setCount] = useOutletContext();
 *   const increment = () => setCount((c) => c + 1);
 *   return <button onClick={increment}>{count}</button>;
 * }
 * ```
 *
 * If you're using TypeScript, we recommend the parent component provide a
 * custom hook for accessing the context value. This makes it easier for
 * consumers to get nice typings, control consumers, and know who's consuming
 * the context value.
 *
 * Here's a more realistic example:
 *
 * ```tsx filename=src/routes/dashboard.tsx lines=[14,20]
 * import { useState } from "react";
 * import { Outlet, useOutletContext } from "react-router";
 *
 * import type { User } from "./types";
 *
 * type ContextType = { user: User | null };
 *
 * export default function Dashboard() {
 *   const [user, setUser] = useState<User | null>(null);
 *
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <Outlet context={{ user } satisfies ContextType} />
 *     </div>
 *   );
 * }
 *
 * export function useUser() {
 *   return useOutletContext<ContextType>();
 * }
 * ```
 *
 * ```tsx filename=src/routes/dashboard/messages.tsx lines=[1,4]
 * import { useUser } from "../dashboard";
 *
 * export default function DashboardMessages() {
 *   const { user } = useUser();
 *   return (
 *     <div>
 *       <h2>Messages</h2>
 *       <p>Hello, {user.name}!</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @returns The context value passed to the parent {@link Outlet} component
 */
declare function useOutletContext<Context = unknown>(): Context;
/**
 * Returns the element for the child route at this level of the route
 * hierarchy. Used internally by {@link Outlet | `<Outlet>`} to render child
 * routes.
 *
 * @public
 * @category Hooks
 * @param context The context to pass to the outlet
 * @returns The child route element or `null` if no child routes match
 */
declare function useOutlet(context?: unknown): React$1.ReactElement | null;
/**
 * Returns an object of key/value-pairs of the dynamic params from the current
 * URL that were matched by the routes. Child routes inherit all params from
 * their parent routes.
 *
 * Assuming a route pattern like `/posts/:postId` is matched by `/posts/123`
 * then `params.postId` will be `"123"`.
 *
 * @example
 * import { useParams } from "react-router";
 *
 * function SomeComponent() {
 *   let params = useParams();
 *   params.postId;
 * }
 *
 * @additionalExamples
 * ### Basic Usage
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * // given a route like:
 * <Route path="/posts/:postId" element={<Post />} />;
 *
 * // or a data route like:
 * createBrowserRouter([
 *   {
 *     path: "/posts/:postId",
 *     component: Post,
 *   },
 * ]);
 *
 * // or in routes.ts
 * route("/posts/:postId", "routes/post.tsx");
 * ```
 *
 * Access the params in a component:
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * export default function Post() {
 *   let params = useParams();
 *   return <h1>Post: {params.postId}</h1>;
 * }
 * ```
 *
 * ### Multiple Params
 *
 * Patterns can have multiple params:
 *
 * ```tsx
 * "/posts/:postId/comments/:commentId";
 * ```
 *
 * All will be available in the params object:
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * export default function Post() {
 *   let params = useParams();
 *   return (
 *     <h1>
 *       Post: {params.postId}, Comment: {params.commentId}
 *     </h1>
 *   );
 * }
 * ```
 *
 * ### Catchall Params
 *
 * Catchall params are defined with `*`:
 *
 * ```tsx
 * "/files/*";
 * ```
 *
 * The matched value will be available in the params object as follows:
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * export default function File() {
 *   let params = useParams();
 *   let catchall = params["*"];
 *   // ...
 * }
 * ```
 *
 * You can destructure the catchall param:
 *
 * ```tsx
 * export default function File() {
 *   let { "*": catchall } = useParams();
 *   console.log(catchall);
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @returns An object containing the dynamic route parameters
 */
declare function useParams<ParamsOrKey extends string | Record<string, string | undefined> = string>(): Readonly<[ParamsOrKey] extends [string] ? Params<ParamsOrKey> : Partial<ParamsOrKey>>;
/**
 * Resolves the pathname of the given `to` value against the current
 * {@link Location}. Similar to {@link useHref}, but returns a
 * {@link Path} instead of a string.
 *
 * @example
 * import { useResolvedPath } from "react-router";
 *
 * function SomeComponent() {
 *   // if the user is at /dashboard/profile
 *   let path = useResolvedPath("../accounts");
 *   path.pathname; // "/dashboard/accounts"
 *   path.search; // ""
 *   path.hash; // ""
 * }
 *
 * @public
 * @category Hooks
 * @param to The path to resolve
 * @param options Options
 * @param options.relative Defaults to `"route"` so routing is relative to the route tree.
 *                         Set to `"path"` to make relative routing operate against path segments.
 * @returns The resolved {@link Path} object with `pathname`, `search`, and `hash`
 */
declare function useResolvedPath(to: To, {
  relative
}?: {
  relative?: RelativeRoutingType;
}): Path;
/**
 * Hook version of {@link Routes | `<Routes>`} that uses objects instead of
 * components. These objects have the same properties as the component props.
 * The return value of `useRoutes` is either a valid React element you can use
 * to render the route tree, or `null` if nothing matched.
 *
 * @example
 * import { useRoutes } from "react-router";
 *
 * function App() {
 *   let element = useRoutes([
 *     {
 *       path: "/",
 *       element: <Dashboard />,
 *       children: [
 *         {
 *           path: "messages",
 *           element: <DashboardMessages />,
 *         },
 *         { path: "tasks", element: <DashboardTasks /> },
 *       ],
 *     },
 *     { path: "team", element: <AboutPage /> },
 *   ]);
 *
 *   return element;
 * }
 *
 * @public
 * @category Hooks
 * @param routes An array of {@link RouteObject}s that define the route hierarchy
 * @param locationArg An optional {@link Location} object or pathname string to
 * use instead of the current {@link Location}
 * @returns A React element to render the matched route, or `null` if no routes matched
 */
declare function useRoutes(routes: RouteObject[], locationArg?: Partial<Location> | string): React$1.ReactElement | null;
type UseNavigationResult = UseNavigationResultStates[keyof UseNavigationResultStates];
type UseNavigationResultStates = {
  Idle: Omit<NavigationStates["Idle"], "matches" | "historyAction">;
  Loading: Omit<NavigationStates["Loading"], "matches" | "historyAction">;
  Submitting: Omit<NavigationStates["Submitting"], "matches" | "historyAction">;
};
/**
 * Returns the current {@link Navigation}, defaulting to an "idle" navigation
 * when no navigation is in progress. You can use this to render pending UI
 * (like a global spinner) or read [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 * from a form navigation.
 *
 * @example
 * import { useNavigation } from "react-router";
 *
 * function SomeComponent() {
 *   let navigation = useNavigation();
 *   navigation.state;
 *   navigation.formData;
 *   // etc.
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The current {@link Navigation} object
 */
declare function useNavigation(): UseNavigationResult;
/**
 * Revalidate the data on the page for reasons outside of normal data mutations
 * like [`Window` focus](https://developer.mozilla.org/en-US/docs/Web/API/Window/focus_event)
 * or polling on an interval.
 *
 * Note that page data is already revalidated automatically after actions.
 * If you find yourself using this for normal CRUD operations on your data in
 * response to user interactions, you're probably not taking advantage of the
 * other APIs like {@link useFetcher}, {@link Form}, {@link useSubmit} that do
 * this automatically.
 *
 * @example
 * import { useRevalidator } from "react-router";
 *
 * function WindowFocusRevalidator() {
 *   const revalidator = useRevalidator();
 *
 *   useFakeWindowFocus(() => {
 *     revalidator.revalidate();
 *   });
 *
 *   return (
 *     <div hidden={revalidator.state === "idle"}>
 *       Revalidating...
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns An object with a `revalidate` function and the current revalidation
 * `state`
 */
declare function useRevalidator(): {
  revalidate: () => Promise<void>;
  state: Router["state"]["revalidation"];
};
/**
 * Returns the active route matches, useful for accessing `loaderData` for
 * parent/child routes or the route [`handle`](../../start/framework/route-module#handle)
 * property
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns An array of {@link UIMatch | UI matches} for the current route hierarchy
 */
declare function useMatches(): UIMatch[];
/**
 * Returns the data from the closest route
 * [`loader`](../../start/framework/route-module#loader) or
 * [`clientLoader`](../../start/framework/route-module#clientloader).
 *
 * @example
 * import { useLoaderData } from "react-router";
 *
 * export async function loader() {
 *   return await fakeDb.invoices.findAll();
 * }
 *
 * export default function Invoices() {
 *   let invoices = useLoaderData<typeof loader>();
 *   // ...
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The data returned from the route's [`loader`](../../start/framework/route-module#loader) or [`clientLoader`](../../start/framework/route-module#clientloader) function
 */
declare function useLoaderData<T = any>(): SerializeFrom<T>;
/**
 * Returns the [`loader`](../../start/framework/route-module#loader) data for a
 * given route by route ID.
 *
 * Route IDs are created automatically. They are simply the path of the route file
 * relative to the app folder without the extension.
 *
 * | Route Filename               | Route ID               |
 * | ---------------------------- | ---------------------- |
 * | `app/root.tsx`               | `"root"`               |
 * | `app/routes/teams.tsx`       | `"routes/teams"`       |
 * | `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |
 *
 * @example
 * import { useRouteLoaderData } from "react-router";
 *
 * function SomeComponent() {
 *   const { user } = useRouteLoaderData("root");
 * }
 *
 * // You can also specify your own route ID's manually in your routes.ts file:
 * route("/", "containers/app.tsx", { id: "app" })
 * useRouteLoaderData("app");
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param routeId The ID of the route to return loader data from
 * @returns The data returned from the specified route's [`loader`](../../start/framework/route-module#loader)
 * function, or `undefined` if not found
 */
declare function useRouteLoaderData<T = any>(routeId: string): SerializeFrom<T> | undefined;
/**
 * Returns the [`action`](../../start/framework/route-module#action) data from
 * the most recent `POST` navigation form submission or `undefined` if there
 * hasn't been one.
 *
 * @example
 * import { Form, useActionData } from "react-router";
 *
 * export async function action({ request }) {
 *   const body = await request.formData();
 *   const name = body.get("visitorsName");
 *   return { message: `Hello, ${name}` };
 * }
 *
 * export default function Invoices() {
 *   const data = useActionData();
 *   return (
 *     <Form method="post">
 *       <input type="text" name="visitorsName" />
 *       {data ? data.message : "Waiting..."}
 *     </Form>
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The data returned from the route's [`action`](../../start/framework/route-module#action)
 * function, or `undefined` if no [`action`](../../start/framework/route-module#action)
 * has been called
 */
declare function useActionData<T = any>(): SerializeFrom<T> | undefined;
/**
 * Accesses the error thrown during an
 * [`action`](../../start/framework/route-module#action),
 * [`loader`](../../start/framework/route-module#loader),
 * or component render to be used in a route module
 * [`ErrorBoundary`](../../start/framework/route-module#errorboundary).
 *
 * @example
 * export function ErrorBoundary() {
 *   const error = useRouteError();
 *   return <div>{error.message}</div>;
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The error that was thrown during route [loading](../../start/framework/route-module#loader),
 * [`action`](../../start/framework/route-module#action) execution, or rendering
 */
declare function useRouteError(): unknown;
/**
 * Returns the resolved promise value from the closest {@link Await | `<Await>`}.
 *
 * @example
 * function SomeDescendant() {
 *   const value = useAsyncValue();
 *   // ...
 * }
 *
 * // somewhere in your app
 * <Await resolve={somePromise}>
 *   <SomeDescendant />
 * </Await>;
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The resolved value from the nearest {@link Await} component
 */
declare function useAsyncValue(): unknown;
/**
 * Returns the rejection value from the closest {@link Await | `<Await>`}.
 *
 * @example
 * import { Await, useAsyncError } from "react-router";
 *
 * function ErrorElement() {
 *   const error = useAsyncError();
 *   return (
 *     <p>Uh Oh, something went wrong! {error.message}</p>
 *   );
 * }
 *
 * // somewhere in your app
 * <Await
 *   resolve={promiseThatRejects}
 *   errorElement={<ErrorElement />}
 * />;
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The error that was thrown in the nearest {@link Await} component
 */
declare function useAsyncError(): unknown;
/**
 * Allow the application to block navigations within the SPA and present the
 * user a confirmation dialog to confirm the navigation. Mostly used to avoid
 * using half-filled form data. This does not handle hard-reloads or
 * cross-origin navigations.
 *
 * The {@link Blocker} object returned by the hook has the following properties:
 *
 * - **`state`**
 *   - `unblocked` - the blocker is idle and has not prevented any navigation
 *   - `blocked` - the blocker has prevented a navigation
 *   - `proceeding` - the blocker is proceeding through from a blocked navigation
 * - **`location`**
 *   - When in a `blocked` state, this represents the {@link Location} to which
 *     we blocked a navigation. When in a `proceeding` state, this is the
 *     location being navigated to after a `blocker.proceed()` call.
 * - **`proceed()`**
 *   - When in a `blocked` state, you may call `blocker.proceed()` to proceed to
 *     the blocked location.
 * - **`reset()`**
 *   - When in a `blocked` state, you may call `blocker.reset()` to return the
 *     blocker to an `unblocked` state and leave the user at the current
 *     location.
 *
 * @example
 * // Boolean version
 * let blocker = useBlocker(value !== "");
 *
 * // Function version
 * let blocker = useBlocker(
 *   ({ currentLocation, nextLocation, historyAction }) =>
 *     value !== "" &&
 *     currentLocation.pathname !== nextLocation.pathname
 * );
 *
 * @additionalExamples
 * ```tsx
 * import { useCallback, useState } from "react";
 * import { BlockerFunction, useBlocker } from "react-router";
 *
 * export function ImportantForm() {
 *   const [value, setValue] = useState("");
 *
 *   const shouldBlock = useCallback<BlockerFunction>(
 *     () => value !== "",
 *     [value]
 *   );
 *   const blocker = useBlocker(shouldBlock);
 *
 *   return (
 *     <form
 *       onSubmit={(e) => {
 *         e.preventDefault();
 *         setValue("");
 *         if (blocker.state === "blocked") {
 *           blocker.proceed();
 *         }
 *       }}
 *     >
 *       <input
 *         name="data"
 *         value={value}
 *         onChange={(e) => setValue(e.target.value)}
 *       />
 *
 *       <button type="submit">Save</button>
 *
 *       {blocker.state === "blocked" ? (
 *         <>
 *           <p style={{ color: "red" }}>
 *             Blocked the last navigation to
 *           </p>
 *           <button
 *             type="button"
 *             onClick={() => blocker.proceed()}
 *           >
 *             Let me through
 *           </button>
 *           <button
 *             type="button"
 *             onClick={() => blocker.reset()}
 *           >
 *             Keep me here
 *           </button>
 *         </>
 *       ) : blocker.state === "proceeding" ? (
 *         <p style={{ color: "orange" }}>
 *           Proceeding through blocked navigation
 *         </p>
 *       ) : (
 *         <p style={{ color: "green" }}>
 *           Blocker is currently unblocked
 *         </p>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param shouldBlock Either a boolean or a function returning a boolean which
 * indicates whether the navigation should be blocked. The function format
 * receives a single object parameter containing the `currentLocation`,
 * `nextLocation`, and `historyAction` of the potential navigation.
 * @returns A {@link Blocker} object with state and reset functionality
 */
declare function useBlocker(shouldBlock: boolean | BlockerFunction): Blocker;
type UseRouteArgs = [] | [routeId: keyof RouteModules];
type UseRouteResult<Args extends UseRouteArgs> = Args extends [] ? UseRoute<unknown> : Args extends ["root"] ? UseRoute<"root"> : Args extends [infer RouteId extends keyof RouteModules] ? UseRoute<RouteId> | undefined : never;
type UseRoute<RouteId extends keyof RouteModules | unknown> = {
  handle: RouteId extends keyof RouteModules ? RouteModules[RouteId] extends {
    handle: infer handle;
  } ? handle : unknown : unknown;
  loaderData: RouteId extends keyof RouteModules ? GetLoaderData<RouteModules[RouteId]> | undefined : unknown;
  actionData: RouteId extends keyof RouteModules ? GetActionData<RouteModules[RouteId]> | undefined : unknown;
};
declare function useRoute<Args extends UseRouteArgs>(...args: Args): UseRouteResult<Args>;
/**
 * A single route match returned from {@link unstable_useRouterState}. Mirrors
 * {@link UIMatch} minus the data-related fields (`data`, `loaderData`).
 */
type unstable_RouterStateMatch<Handle = unknown> = Omit<UIMatch<unknown, Handle>, "data" | "loaderData">;
/**
 * The shape of the `active` variant returned from
 * {@link unstable_useRouterState}.
 */
type unstable_RouterStateActiveVariant = {
  location: Location;
  searchParams: URLSearchParams;
  params: Params;
  matches: unstable_RouterStateMatch[];
  type: Action;
};
/**
 * The shape of the `pending` variant returned from
 * {@link unstable_useRouterState}. Extends
 * {@link unstable_RouterStateActiveVariant} with the navigation `state` and
 * submission fields mirroring {@link useNavigation} — submission fields are
 * populated when the in-flight navigation was triggered by a form submission,
 * otherwise `undefined`.
 */
type unstable_RouterStatePendingVariant = unstable_RouterStatePendingVariants[keyof unstable_RouterStatePendingVariants];
type unstable_RouterStatePendingVariants = {
  Loading: unstable_RouterStateActiveVariant & Omit<NavigationStates["Loading"], "matches" | "historyAction">;
  Submitting: unstable_RouterStateActiveVariant & Omit<NavigationStates["Submitting"], "matches" | "historyAction">;
};
/**
 * The return shape of {@link unstable_useRouterState}.
 *
 * `active` reflects the currently-committed location. `pending` reflects the
 * in-flight navigation (if any).
 */
type unstable_RouterState = {
  active: unstable_RouterStateActiveVariant;
  pending: unstable_RouterStatePendingVariant | null;
};
/**
 * A unified hook for reading router state: current (`active`) and in-flight
 * (`pending`) locations, search params, params, matches, and navigation type.
 *
 * This hook consolidates the information you used to get from {@link useLocation},
 * {@link useSearchParams}, {@link useParams}, {@link useMatches}, {@link useNavigation},
 * and {@link useNavigationType} into a single hook.
 *
 *
 * @example
 * import { unstable_useRouterState as useRouterState } from "react-router";
 *
 * let { active, pending } = unstable_useRouterState();
 *
 * // Active is always populated with the current location
 * active.location; // replaces `useLocation()`
 * active.searchParams; // replaces `useSearchParams()[0]`
 * active.params; // replaces `useParams()`
 * active.matches; // replaces `useMatches()`
 * active.type; // replaces `useNavigationType()`
 *
 * // Pending is only populated during a navigation
 * pending.location; // replaces `useNavigation().location`
 * pending.searchParams; // equivalent to `new URLSearchParams(useNavigation().search)`
 * pending.params; // Not directly accessible today
 * pending.matches; // Not directly accessible today
 * pending.type; // Not directly accessible today
 * pending.state; // replaces `useNavigation().state`
 * pending.formMethod; // replaces useNavigation().formMethod
 * pending.formAction; // replaces useNavigation().formAction
 * pending.formEncType; // replaces useNavigation().formEncType
 * pending.formData; // replaces useNavigation().formData
 * pending.json; // replaces useNavigation().json
 * pending.text; // replaces useNavigation().text
 *
 * @name unstable_useRouterState
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The current router state with `active` and `pending` variants
 */
declare function useRouterState(): unstable_RouterState;
//#endregion
export { NavigateFunction, unstable_RouterState, unstable_RouterStateActiveVariant, unstable_RouterStatePendingVariant, useActionData, useAsyncError, useAsyncValue, useBlocker, useHref, useInRouterContext, useLoaderData, useLocation, useMatch, useMatches, useNavigate, useNavigation, useNavigationType, useOutlet, useOutletContext, useParams, useResolvedPath, useRevalidator, useRoute, useRouteError, useRouteLoaderData, useRouterState, useRoutes };
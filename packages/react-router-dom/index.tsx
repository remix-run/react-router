/**
 * NOTE: If you refactor this to split up the modules into separate files,
 * you'll need to update the rollup config for react-router-dom-v5-compat.
 */
import * as React from "react";
import {
  Router,
  createPath,
  useHref,
  useLocation,
  useMatch,
  useNavigate,
  useRenderDataRouter,
  useResolvedPath,
  UNSAFE_RouteContext,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
} from "react-router";
import type { To } from "react-router";
import type {
  BrowserHistory,
  Fetcher,
  FormEncType,
  FormMethod,
  HashHistory,
  History,
  HydrationState,
  GetScrollRestorationKeyFunction,
  RouteObject,
} from "@remix-run/router";
import {
  createBrowserHistory,
  createHashHistory,
  createBrowserRouter,
  createHashRouter,
  invariant,
  matchPath,
} from "@remix-run/router";

import type {
  SubmitOptions,
  ParamKeyValuePair,
  URLSearchParamsInit,
} from "./dom";
import {
  createSearchParams,
  defaultMethod,
  getFormSubmissionInfo,
  getSearchParamsForLocation,
  shouldProcessLinkClick,
} from "./dom";

////////////////////////////////////////////////////////////////////////////////
//#region Re-exports
////////////////////////////////////////////////////////////////////////////////

export type { ParamKeyValuePair, URLSearchParamsInit };
export { createSearchParams };

// Note: Keep in sync with react-router exports!
export type {
  ActionFunction,
  DataMemoryRouterProps,
  DataRouteMatch,
  Fetcher,
  Hash,
  IndexRouteProps,
  JsonFunction,
  LayoutRouteProps,
  LoaderFunction,
  Location,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigation,
  Navigator,
  OutletProps,
  Params,
  Path,
  PathMatch,
  Pathname,
  PathPattern,
  PathRouteProps,
  RedirectFunction,
  RouteMatch,
  RouteObject,
  RouteProps,
  RouterProps,
  RoutesProps,
  Search,
  ShouldRevalidateFunction,
  To,
} from "react-router";
export {
  DataMemoryRouter,
  MemoryRouter,
  Navigate,
  NavigationType,
  Outlet,
  Route,
  Router,
  Routes,
  createPath,
  createRoutesFromChildren,
  isRouteErrorResponse,
  generatePath,
  json,
  matchPath,
  matchRoutes,
  parsePath,
  redirect,
  renderMatches,
  resolvePath,
  useActionData,
  useHref,
  useInRouterContext,
  useLoaderData,
  useLocation,
  useMatch,
  useMatches,
  useNavigate,
  useNavigation,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useRevalidator,
  useRouteError,
  useRouteLoaderData,
  useRoutes,
} from "react-router";

///////////////////////////////////////////////////////////////////////////////
// DANGER! PLEASE READ ME!
// We provide these exports as an escape hatch in the event that you need any
// routing data that we don't provide an explicit API for. With that said, we
// want to cover your use case if we can, so if you feel the need to use these
// we want to hear from you. Let us know what you're building and we'll do our
// best to make sure we can support you!
//
// We consider these exports an implementation detail and do not guarantee
// against any breaking changes, regardless of the semver release. Use with
// extreme caution and only if you understand the consequences. Godspeed.
///////////////////////////////////////////////////////////////////////////////

/** @internal */
export {
  UNSAFE_NavigationContext,
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  useRenderDataRouter,
} from "react-router";
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Components
////////////////////////////////////////////////////////////////////////////////

export interface DataBrowserRouterProps {
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactNode;
  routes?: RouteObject[];
  window?: Window;
}

export function DataBrowserRouter({
  children,
  fallbackElement,
  hydrationData,
  routes,
  window,
}: DataBrowserRouterProps): React.ReactElement {
  return useRenderDataRouter({
    children,
    fallbackElement,
    routes,
    createRouter: (routes) =>
      createBrowserRouter({
        routes,
        hydrationData,
        window,
      }),
  });
}

export interface DataHashRouterProps {
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactNode;
  routes?: RouteObject[];
  window?: Window;
}

export function DataHashRouter({
  children,
  hydrationData,
  fallbackElement,
  routes,
  window,
}: DataBrowserRouterProps): React.ReactElement {
  return useRenderDataRouter({
    children,
    fallbackElement,
    routes,
    createRouter: (routes) =>
      createHashRouter({
        routes,
        hydrationData,
        window,
      }),
  });
}

export interface BrowserRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}

/**
 * A `<Router>` for use in web browsers. Provides the cleanest URLs.
 */
export function BrowserRouter({
  basename,
  children,
  window,
}: BrowserRouterProps) {
  let historyRef = React.useRef<BrowserHistory>();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window, v5Compat: true });
  }

  let history = historyRef.current;
  let [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

export interface HashRouterProps {
  basename?: string;
  children?: React.ReactNode;
  window?: Window;
}

/**
 * A `<Router>` for use in web browsers. Stores the location in the hash
 * portion of the URL so it is not sent to the server.
 */
export function HashRouter({ basename, children, window }: HashRouterProps) {
  let historyRef = React.useRef<HashHistory>();
  if (historyRef.current == null) {
    historyRef.current = createHashHistory({ window, v5Compat: true });
  }

  let history = historyRef.current;
  let [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

export interface HistoryRouterProps {
  basename?: string;
  children?: React.ReactNode;
  history: History;
}

/**
 * A `<Router>` that accepts a pre-instantiated history object. It's important
 * to note that using your own history object is highly discouraged and may add
 * two versions of the history library to your bundles unless you use the same
 * version of the history library that React Router uses internally.
 */
function HistoryRouter({ basename, children, history }: HistoryRouterProps) {
  const [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

if (__DEV__) {
  HistoryRouter.displayName = "unstable_HistoryRouter";
}

export { HistoryRouter as unstable_HistoryRouter };

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  reloadDocument?: boolean;
  replace?: boolean;
  state?: any;
  resetScroll?: boolean;
  to: To;
}

/**
 * The public API for rendering a history-aware <a>.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkWithRef(
    {
      onClick,
      reloadDocument,
      replace = false,
      state,
      target,
      to,
      resetScroll,
      ...rest
    },
    ref
  ) {
    let href = useHref(to);
    let internalOnClick = useLinkClickHandler(to, {
      replace,
      state,
      target,
      resetScroll,
    });
    function handleClick(
      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
    ) {
      if (onClick) onClick(event);
      if (!event.defaultPrevented && !reloadDocument) {
        internalOnClick(event);
      }
    }

    return (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        {...rest}
        href={href}
        onClick={handleClick}
        ref={ref}
        target={target}
      />
    );
  }
);

if (__DEV__) {
  Link.displayName = "Link";
}

export interface NavLinkProps
  extends Omit<LinkProps, "className" | "style" | "children"> {
  children?:
    | React.ReactNode
    | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
  caseSensitive?: boolean;
  className?:
    | string
    | ((props: {
        isActive: boolean;
        isPending: boolean;
      }) => string | undefined);
  end?: boolean;
  style?:
    | React.CSSProperties
    | ((props: {
        isActive: boolean;
        isPending: boolean;
      }) => React.CSSProperties);
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLinkWithRef(
    {
      "aria-current": ariaCurrentProp = "page",
      caseSensitive = false,
      className: classNameProp = "",
      end = false,
      style: styleProp,
      to,
      children,
      ...rest
    },
    ref
  ) {
    let path = useResolvedPath(to);
    let match = useMatch({ path: path.pathname, end, caseSensitive });

    let routerState = React.useContext(UNSAFE_DataRouterStateContext);
    let nextLocation = routerState?.navigation.location;
    let nextPath = useResolvedPath(nextLocation || "");
    let nextMatch = React.useMemo(
      () =>
        nextLocation
          ? matchPath(
              { path: path.pathname, end, caseSensitive },
              nextPath.pathname
            )
          : null,
      [nextLocation, path.pathname, caseSensitive, end, nextPath.pathname]
    );

    let isPending = nextMatch != null;
    let isActive = match != null;

    let ariaCurrent = isActive ? ariaCurrentProp : undefined;

    let className: string | undefined;
    if (typeof classNameProp === "function") {
      className = classNameProp({ isActive, isPending });
    } else {
      // If the className prop is not a function, we use a default `active`
      // class for <NavLink />s that are active. In v5 `active` was the default
      // value for `activeClassName`, but we are removing that API and can still
      // use the old default behavior for a cleaner upgrade path and keep the
      // simple styling rules working as they currently do.
      className = [
        classNameProp,
        isActive ? "active" : null,
        isPending ? "pending" : null,
      ]
        .filter(Boolean)
        .join(" ");
    }

    let style =
      typeof styleProp === "function"
        ? styleProp({ isActive, isPending })
        : styleProp;

    return (
      <Link
        {...rest}
        aria-current={ariaCurrent}
        className={className}
        ref={ref}
        style={style}
        to={to}
      >
        {typeof children === "function"
          ? children({ isActive, isPending })
          : children}
      </Link>
    );
  }
);

if (__DEV__) {
  NavLink.displayName = "NavLink";
}

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /**
   * The HTTP verb to use when the form is submit. Supports "get", "post",
   * "put", "delete", "patch".
   */
  method?: FormMethod;

  /**
   * Normal `<form action>` but supports React Router's relative paths.
   */
  action?: string;

  /**
   * Replaces the current entry in the browser history stack when the form
   * navigates. Use this if you don't want the user to be able to click "back"
   * to the page with the form on it.
   */
  replace?: boolean;

  /**
   * A function to call when the form is submitted. If you call
   * `event.preventDefault()` then this form will not do anything.
   */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

/**
 * A `@remix-run/router`-aware `<form>`. It behaves like a normal form except
 * that the interaction with the server is with `fetch` instead of new document
 * requests, allowing components to add nicer UX to the page as the form is
 * submitted and returns with data.
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (props, ref) => {
    return <FormImpl {...props} ref={ref} />;
  }
);

if (__DEV__) {
  Form.displayName = "Form";
}

type HTMLSubmitEvent = React.BaseSyntheticEvent<
  SubmitEvent,
  Event,
  HTMLFormElement
>;

type HTMLFormSubmitter = HTMLButtonElement | HTMLInputElement;

interface FormImplProps extends FormProps {
  fetcherKey?: string;
}

const FormImpl = React.forwardRef<HTMLFormElement, FormImplProps>(
  (
    {
      replace,
      method = defaultMethod,
      action = ".",
      onSubmit,
      fetcherKey,
      ...props
    },
    forwardedRef
  ) => {
    let submit = useSubmitImpl(fetcherKey);
    let formMethod: FormMethod =
      method.toLowerCase() === "get" ? "get" : "post";
    let formAction = useFormAction(action);
    let submitHandler: React.FormEventHandler<HTMLFormElement> = (event) => {
      onSubmit && onSubmit(event);
      if (event.defaultPrevented) return;
      event.preventDefault();

      let submitter = (event as unknown as HTMLSubmitEvent).nativeEvent
        .submitter as HTMLFormSubmitter | null;

      submit(submitter || event.currentTarget, { method, replace });
    };

    return (
      <form
        ref={forwardedRef}
        method={formMethod}
        action={formAction}
        onSubmit={submitHandler}
        {...props}
      />
    );
  }
);

if (__DEV__) {
  Form.displayName = "Form";
}

interface ScrollRestorationProps {
  getKey?: GetScrollRestorationKeyFunction;
  storageKey?: string;
}

/**
 * This component will emulate the browser's scroll restoration on location
 * changes.
 */
export function ScrollRestoration({
  getKey,
  storageKey,
}: ScrollRestorationProps) {
  useScrollRestoration({ getKey, storageKey });
  return null;
}

if (__DEV__) {
  ScrollRestoration.displayName = "ScrollRestoration";
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Hooks
////////////////////////////////////////////////////////////////////////////////

/**
 * Handles the click behavior for router `<Link>` components. This is useful if
 * you need to create custom `<Link>` components with the same click behavior we
 * use in our exported `<Link>`.
 */
export function useLinkClickHandler<E extends Element = HTMLAnchorElement>(
  to: To,
  {
    target,
    replace: replaceProp,
    state,
    resetScroll,
  }: {
    target?: React.HTMLAttributeAnchorTarget;
    replace?: boolean;
    state?: any;
    resetScroll?: boolean;
  } = {}
): (event: React.MouseEvent<E, MouseEvent>) => void {
  let navigate = useNavigate();
  let location = useLocation();
  let path = useResolvedPath(to);

  return React.useCallback(
    (event: React.MouseEvent<E, MouseEvent>) => {
      if (shouldProcessLinkClick(event, target)) {
        event.preventDefault();

        // If the URL hasn't changed, a regular <a> will do a replace instead of
        // a push, so do the same here.
        let replace =
          !!replaceProp || createPath(location) === createPath(path);

        navigate(to, { replace, state, resetScroll });
      }
    },
    [location, navigate, path, replaceProp, state, target, to, resetScroll]
  );
}

/**
 * A convenient wrapper for reading and writing search parameters via the
 * URLSearchParams interface.
 */
export function useSearchParams(defaultInit?: URLSearchParamsInit) {
  warning(
    typeof URLSearchParams !== "undefined",
    `You cannot use the \`useSearchParams\` hook in a browser that does not ` +
      `support the URLSearchParams API. If you need to support Internet ` +
      `Explorer 11, we recommend you load a polyfill such as ` +
      `https://github.com/ungap/url-search-params\n\n` +
      `If you're unsure how to load polyfills, we recommend you check out ` +
      `https://polyfill.io/v3/ which provides some recommendations about how ` +
      `to load polyfills only for users that need them, instead of for every ` +
      `user.`
  );

  let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));

  let location = useLocation();
  let searchParams = React.useMemo(
    () =>
      getSearchParamsForLocation(
        location.search,
        defaultSearchParamsRef.current
      ),
    [location.search]
  );

  let navigate = useNavigate();
  let setSearchParams = React.useCallback(
    (
      nextInit: URLSearchParamsInit,
      navigateOptions?: { replace?: boolean; state?: any }
    ) => {
      navigate("?" + createSearchParams(nextInit), navigateOptions);
    },
    [navigate]
  );

  return [searchParams, setSearchParams] as const;
}

/**
 * Submits a HTML `<form>` to the server without reloading the page.
 */
export interface SubmitFunction {
  (
    /**
     * Specifies the `<form>` to be submitted to the server, a specific
     * `<button>` or `<input type="submit">` to use to submit the form, or some
     * arbitrary data to submit.
     *
     * Note: When using a `<button>` its `name` and `value` will also be
     * included in the form data that is submitted.
     */
    target:
      | HTMLFormElement
      | HTMLButtonElement
      | HTMLInputElement
      | FormData
      | URLSearchParams
      | { [name: string]: string }
      | null,

    /**
     * Options that override the `<form>`'s own attributes. Required when
     * submitting arbitrary data without a backing `<form>`.
     */
    options?: SubmitOptions
  ): void;
}

/**
 * Returns a function that may be used to programmatically submit a form (or
 * some arbitrary data) to the server.
 */
export function useSubmit(): SubmitFunction {
  return useSubmitImpl();
}

function useSubmitImpl(fetcherKey?: string): SubmitFunction {
  let router = React.useContext(UNSAFE_DataRouterContext);
  let defaultAction = useFormAction();

  return React.useCallback(
    (target, options = {}) => {
      invariant(
        router != null,
        "useSubmit() must be used within a <DataRouter>"
      );

      if (typeof document === "undefined") {
        throw new Error(
          "You are calling submit during the server render. " +
            "Try calling submit within a `useEffect` or callback instead."
        );
      }

      let { method, encType, formData, url } = getFormSubmissionInfo(
        target,
        defaultAction,
        options
      );

      let href = url.pathname + url.search;
      let opts = {
        // If replace is not specified, we'll default to false for GET and
        // true otherwise
        replace:
          options.replace != null ? options.replace === true : method !== "get",
        formData,
        formMethod: method as FormMethod,
        formEncType: encType as FormEncType,
      };
      if (fetcherKey) {
        router.fetch(fetcherKey, href, opts);
      } else {
        router.navigate(href, opts);
      }
    },
    [defaultAction, router, fetcherKey]
  );
}

export function useFormAction(action = "."): string {
  let routeContext = React.useContext(UNSAFE_RouteContext);
  invariant(routeContext, "useFormAction must be used inside a RouteContext");

  let [match] = routeContext.matches.slice(-1);
  let { pathname, search } = useResolvedPath(action);

  if (action === "." && match.route.index) {
    search = search ? search.replace(/^\?/, "?index&") : "?index";
  }

  return pathname + search;
}

function createFetcherForm(fetcherKey: string) {
  let FetcherForm = React.forwardRef<HTMLFormElement, FormProps>(
    (props, ref) => {
      return <FormImpl {...props} ref={ref} fetcherKey={fetcherKey} />;
    }
  );
  if (__DEV__) {
    FetcherForm.displayName = "fetcher.Form";
  }
  return FetcherForm;
}

let fetcherId = 0;

type FetcherWithComponents<TData> = Fetcher<TData> & {
  Form: ReturnType<typeof createFetcherForm>;
  submit: ReturnType<typeof useSubmitImpl>;
  load: (href: string) => void;
};

/**
 * Interacts with route loaders and actions without causing a navigation. Great
 * for any interaction that stays on the same page.
 */
export function useFetcher<TData = any>(): FetcherWithComponents<TData> {
  let router = React.useContext(UNSAFE_DataRouterContext);
  invariant(router, `useFetcher must be used within a DataRouter`);

  let [fetcherKey] = React.useState(() => String(++fetcherId));
  let [Form] = React.useState(() => createFetcherForm(fetcherKey));
  let [load] = React.useState(() => (href: string) => {
    invariant(router, `No router available for fetcher.load()`);
    router.fetch(fetcherKey, href);
  });
  let submit = useSubmitImpl(fetcherKey);

  let fetcher = router.getFetcher<TData>(fetcherKey);

  let fetcherWithComponents = React.useMemo(
    () => ({
      Form,
      submit,
      load,
      ...fetcher,
    }),
    [fetcher, Form, submit, load]
  );

  React.useEffect(() => {
    // Is this busted when the React team gets real weird and calls effects
    // twice on mount?  We really just need to garbage collect here when this
    // fetcher is no longer around.
    return () => {
      if (!router) {
        console.warn("No fetcher available to clean up from useFetcher()");
        return;
      }
      router.deleteFetcher(fetcherKey);
    };
  }, [router, fetcherKey]);

  return fetcherWithComponents;
}

/**
 * Provides all fetchers currently on the page. Useful for layouts and parent
 * routes that need to provide pending/optimistic UI regarding the fetch.
 */
export function useFetchers(): Fetcher[] {
  let state = React.useContext(UNSAFE_DataRouterStateContext);
  invariant(state, `useFetchers must be used within a DataRouter`);
  return [...state.fetchers.values()];
}

const SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
let savedScrollPositions: Record<string, number> = {};

/**
 * When rendered inside a DataRouter, will restore scroll positions on navigations
 */
function useScrollRestoration({
  getKey,
  storageKey,
}: {
  getKey?: GetScrollRestorationKeyFunction;
  storageKey?: string;
} = {}) {
  let location = useLocation();
  let router = React.useContext(UNSAFE_DataRouterContext);
  let state = React.useContext(UNSAFE_DataRouterStateContext);

  invariant(
    router != null && state != null,
    "useScrollRestoration must be used within a DataRouter"
  );
  let { restoreScrollPosition, resetScrollPosition } = state;

  // Trigger manual scroll restoration while we're active
  React.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);

  // Save positions on unload
  useBeforeUnload(
    React.useCallback(() => {
      if (state?.navigation.state === "idle") {
        let key =
          (getKey ? getKey(state.location, state.matches) : null) ||
          state.location.key;
        savedScrollPositions[key] = window.scrollY;
      }
      sessionStorage.setItem(
        storageKey || SCROLL_RESTORATION_STORAGE_KEY,
        JSON.stringify(savedScrollPositions)
      );
      window.history.scrollRestoration = "auto";
    }, [
      storageKey,
      getKey,
      state.navigation.state,
      state.location,
      state.matches,
    ])
  );

  // Read in any saved scroll locations
  React.useLayoutEffect(() => {
    try {
      let sessionPositions = sessionStorage.getItem(
        storageKey || SCROLL_RESTORATION_STORAGE_KEY
      );
      if (sessionPositions) {
        savedScrollPositions = JSON.parse(sessionPositions);
      }
    } catch (e) {
      // no-op, use default empty object
    }
  }, [storageKey]);

  // Enable scroll restoration in the router
  React.useLayoutEffect(() => {
    let disableScrollRestoration = router?.enableScrollRestoration(
      savedScrollPositions,
      () => window.scrollY,
      getKey
    );
    return () => disableScrollRestoration && disableScrollRestoration();
  }, [router, getKey]);

  // Restore scrolling when state.restoreScrollPosition changes
  React.useLayoutEffect(() => {
    // Explicit false means don't do anything (used for submissions)
    if (restoreScrollPosition === false) {
      return;
    }

    // been here before, scroll to it
    if (typeof restoreScrollPosition === "number") {
      window.scrollTo(0, restoreScrollPosition);
      return;
    }

    // try to scroll to the hash
    if (location.hash) {
      let el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }

    // Opt out of scroll reset if this link requested it
    if (resetScrollPosition === false) {
      return;
    }

    // otherwise go to the top on new locations
    window.scrollTo(0, 0);
  }, [location, restoreScrollPosition, resetScrollPosition]);
}

function useBeforeUnload(callback: () => any): void {
  React.useEffect(() => {
    window.addEventListener("beforeunload", callback);
    return () => {
      window.removeEventListener("beforeunload", callback);
    };
  }, [callback]);
}

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Utils
////////////////////////////////////////////////////////////////////////////////

function warning(cond: boolean, message: string): void {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== "undefined") console.warn(message);

    try {
      // Welcome to debugging React Router!
      //
      // This error is thrown as a convenience so you can more easily
      // find the source for a warning that appears in the console by
      // enabling "pause on exceptions" in your JavaScript debugger.
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}
//#endregion

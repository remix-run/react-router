/**
 * NOTE: If you refactor this to split up the modules into separate files,
 * you'll need to update the rollup config for react-router-dom-v5-compat.
 */
import * as React from "react";
import {
  MemoryRouter,
  DataMemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  createPath,
  parsePath,
  resolvePath,
  renderMatches,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useNavigationType,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes,
  useOutletContext,
  useActionData,
  useLoaderData,
  useMatches,
  useNavigation,
  useRouteLoaderData,
  useRouteException,
  UNSAFE_useRenderDataRouter,
  UNSAFE_RouteContext,
  UNSAFE_DataRouterContext,
} from "react-router";
import type { To } from "react-router";
import type { BrowserHistory, HashHistory, History } from "@remix-run/router";
import {
  createBrowserHistory,
  createHashHistory,
  createBrowserRouter,
  createHashRouter,
  FormEncType,
  FormMethod,
  HydrationState,
  invariant,
  RouteObject,
} from "@remix-run/router";

import type { SubmitOptions, URLSearchParamsInit } from "./dom";
import {
  createSearchParams,
  defaultEncType,
  defaultMethod,
  getFormSubmissionInfo,
  getSearchParamsForLocation,
  shouldProcessLinkClick,
} from "./dom";

////////////////////////////////////////////////////////////////////////////////
//#region Re-exports
////////////////////////////////////////////////////////////////////////////////

// Note: Keep in sync with react-router exports!
export {
  MemoryRouter,
  DataMemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  createPath,
  createSearchParams,
  parsePath,
  renderMatches,
  resolvePath,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useNavigationType,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes,
  useOutletContext,
  useActionData,
  useLoaderData,
  useMatches,
  useNavigation,
  useRouteLoaderData,
  useRouteException,
};

export { NavigationType } from "react-router";
export type {
  Hash,
  Location,
  Path,
  To,
  MemoryRouterProps,
  NavigateFunction,
  NavigateOptions,
  NavigateProps,
  Navigator,
  OutletProps,
  Params,
  PathMatch,
  RouteMatch,
  RouteObject,
  RouteProps,
  PathRouteProps,
  LayoutRouteProps,
  IndexRouteProps,
  RouterProps,
  Pathname,
  Search,
  RoutesProps,
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
  UNSAFE_useRenderDataRouter,
} from "react-router";
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Components
////////////////////////////////////////////////////////////////////////////////

export interface DataBrowserRouterProps {
  basename?: string;
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
  window?: Window;
}

export function DataBrowserRouter({
  basename,
  children,
  fallbackElement,
  hydrationData,
  window,
}: DataBrowserRouterProps): React.ReactElement {
  return UNSAFE_useRenderDataRouter({
    basename,
    children,
    fallbackElement,
    createRouter: (routes: RouteObject[]) =>
      createBrowserRouter({
        basename,
        routes,
        hydrationData,
        window,
      }),
  });
}

export interface DataHashRouterProps {
  basename?: string;
  children?: React.ReactNode;
  hydrationData?: HydrationState;
  fallbackElement?: React.ReactElement;
  window?: Window;
}

export function DataHashRouter({
  basename,
  children,
  hydrationData,
  fallbackElement,
  window,
}: DataBrowserRouterProps): React.ReactElement {
  return UNSAFE_useRenderDataRouter({
    basename,
    children,
    fallbackElement,
    createRouter: (routes: RouteObject[]) =>
      createHashRouter({
        basename,
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
  to: To;
}

/**
 * The public API for rendering a history-aware <a>.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkWithRef(
    { onClick, reloadDocument, replace = false, state, target, to, ...rest },
    ref
  ) {
    let href = useHref(to);
    let internalOnClick = useLinkClickHandler(to, { replace, state, target });
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
    | ((props: { isActive: boolean }) => React.ReactNode);
  caseSensitive?: boolean;
  className?: string | ((props: { isActive: boolean }) => string | undefined);
  end?: boolean;
  style?:
    | React.CSSProperties
    | ((props: { isActive: boolean }) => React.CSSProperties);
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
    let location = useLocation();
    let path = useResolvedPath(to);

    let locationPathname = location.pathname;
    let toPathname = path.pathname;
    if (!caseSensitive) {
      locationPathname = locationPathname.toLowerCase();
      toPathname = toPathname.toLowerCase();
    }

    let isActive =
      locationPathname === toPathname ||
      (!end &&
        locationPathname.startsWith(toPathname) &&
        locationPathname.charAt(toPathname.length) === "/");

    let ariaCurrent = isActive ? ariaCurrentProp : undefined;

    let className: string | undefined;
    if (typeof classNameProp === "function") {
      className = classNameProp({ isActive });
    } else {
      // If the className prop is not a function, we use a default `active`
      // class for <NavLink />s that are active. In v5 `active` was the default
      // value for `activeClassName`, but we are removing that API and can still
      // use the old default behavior for a cleaner upgrade path and keep the
      // simple styling rules working as they currently do.
      className = [classNameProp, isActive ? "active" : null]
        .filter(Boolean)
        .join(" ");
    }

    let style =
      typeof styleProp === "function" ? styleProp({ isActive }) : styleProp;

    return (
      <Link
        {...rest}
        aria-current={ariaCurrent}
        className={className}
        ref={ref}
        style={style}
        to={to}
      >
        {typeof children === "function" ? children({ isActive }) : children}
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
   * Normal `<form encType>`.
   */
  encType?: FormEncType;

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

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      replace = false,
      method = defaultMethod,
      action = ".",
      encType = defaultEncType,
      onSubmit,
      ...props
    },
    forwardedRef
  ) => {
    let submit = useSubmit();
    let formMethod: FormMethod =
      method.toLowerCase() === "get" ? "get" : "post";
    let formAction = useFormAction(action);
    let formRef = React.useRef<HTMLFormElement>();
    let ref = useComposedRefs(forwardedRef, formRef);

    // When calling `submit` on the form element itself, we don't get data from
    // the button that submitted the event. For example:
    //
    //   <Form>
    //     <button name="something" value="whatever">Submit</button>
    //   </Form>
    //
    // formData.get("something") should be "whatever", but we don't get that
    // unless we call submit on the clicked button itself.
    //
    // To figure out which button triggered the submit, we'll attach a click
    // event listener to the form. The click event is always triggered before
    // the submit event (even when submitting via keyboard when focused on
    // another form field, yeeeeet) so we should have access to that button's
    // data for use in the submit handler.
    let clickedButtonRef = React.useRef<any>();

    React.useEffect(() => {
      let form = formRef.current;
      if (!form) return;

      function handleClick(event: MouseEvent) {
        if (!(event.target instanceof Element)) return;
        let submitButton = event.target.closest<
          HTMLButtonElement | HTMLInputElement
        >("button,input[type=submit]");

        if (
          submitButton &&
          submitButton.form === form &&
          submitButton.type === "submit"
        ) {
          clickedButtonRef.current = submitButton;
        }
      }

      window.addEventListener("click", handleClick);
      return () => {
        window.removeEventListener("click", handleClick);
      };
    }, []);

    return (
      <form
        ref={ref}
        method={formMethod}
        action={formAction}
        encType={encType}
        onSubmit={(event) => {
          onSubmit && onSubmit(event);
          if (event.defaultPrevented) return;
          event.preventDefault();

          submit(clickedButtonRef.current || event.currentTarget, {
            method,
            replace,
          });
          clickedButtonRef.current = null;
        }}
        {...props}
      />
    );
  }
);

if (__DEV__) {
  Form.displayName = "Form";
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
  }: {
    target?: React.HTMLAttributeAnchorTarget;
    replace?: boolean;
    state?: any;
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

        navigate(to, { replace, state });
      }
    },
    [location, navigate, path, replaceProp, state, target, to]
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

export function useSubmit(): SubmitFunction {
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

      router.navigate(url.pathname + url.search, {
        replace: options.replace,
        formData,
        formMethod: method as FormMethod,
        formEncType: encType as FormEncType,
      });
    },
    [defaultAction, router]
  );
}

export function useFormAction(action = "."): string {
  let routeContext = React.useContext(UNSAFE_RouteContext);
  invariant(routeContext, "useLoaderData must be used inside a RouteContext");

  let [match] = routeContext.matches.slice(-1);
  let { pathname, search } = useResolvedPath(action);

  if (action === "." && match.route.index) {
    search = search ? search.replace(/^\?/, "?index&") : "?index";
  }

  return pathname + search;
}

function useComposedRefs<RefValueType = any>(
  ...refs: Array<React.Ref<RefValueType> | null | undefined>
): React.RefCallback<RefValueType> {
  return React.useCallback((node) => {
    for (let ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        ref(node);
      } else {
        try {
          (ref as React.MutableRefObject<RefValueType>).current = node!;
        } catch (_) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
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

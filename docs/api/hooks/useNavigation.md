---
title: useNavigation
---

# useNavigation

<!--
⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ 

Thank you for helping improve our documentation!

This file is auto-generated from the JSDoc comments in the source
code, so please edit the JSDoc comments in the file below and this
file will be re-generated once those changes are merged.

https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/hooks.tsx
-->

[MODES: framework, data]

## Summary

[Reference Documentation ↗](https://api.reactrouter.com/v8/functions/react-router.useNavigation.html)

`}">.`,
    );
  }

  let locationFromContext = useLocation();

  let location;
  if (locationArg) {
    let parsedLocationArg =
      typeof locationArg === "string" ? parsePath(locationArg) : locationArg;

    invariant(
      parentPathnameBase === "/" ||
        parsedLocationArg.pathname?.startsWith(parentPathnameBase),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, ` +
        `the location pathname must begin with the portion of the URL pathname that was ` +
        `matched by all parent routes. The current pathname base is "${parentPathnameBase}" ` +
        `but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`,
    );

    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }

  let pathname = location.pathname || "/";

  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    // Determine the remaining pathname by removing the # of URL segments the
    // parentPathnameBase has, instead of removing based on character count.
    // This is because we can't guarantee that incoming/outgoing encodings/
    // decodings will match exactly.
    // We decode paths before matching on a per-segment basis with
    // decodeURIComponent(), but we re-encode pathnames via `new URL()` so they
    // match what `window.location.pathname` would reflect.  Those don't 100%
    // align when it comes to encoded URI characters such as % and &.
    //
    // So we may end up with:
    //   pathname:           "/descendant/a%25b/match"
    //   parentPathnameBase: "/descendant/a%b"
    //
    // And the direct substring removal approach won't work :/
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }

  let matches =
    dataRouterOpts && dataRouterOpts.state.matches.length
      ? // If we're in a data router, use the matches we've already identified but ensure
        // we have the latest route instances from the manifest in case elements have changed
        dataRouterOpts.state.matches.map((m) =>
          Object.assign(m, {
            route: dataRouterOpts.manifest[m.route.id] || m.route,
          }),
        )
      : matchRoutes(routes, { pathname: remainingPathname });

  if (ENABLE_DEV_WARNINGS) {
    warning(
      parentRoute || matches != null,
      `No routes matched location "${location.pathname}${location.search}${location.hash}" `,
    );

    warning(
      matches == null ||
        matches[matches.length - 1].route.element !== undefined ||
        matches[matches.length - 1].route.Component !== undefined ||
        matches[matches.length - 1].route.lazy !== undefined,
      `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" ` +
        `does not have an element or Component. This means it will render an <Outlet /> with a ` +
        `null value by default resulting in an "empty" page.`,
    );
  }

  let renderedMatches = _renderMatches(
    matches &&
      matches.map((match) =>
        Object.assign({}, match, {
          params: Object.assign({}, parentParams, match.params),
          pathname: joinPaths([
            parentPathnameBase,
            // Re-encode pathnames that were decoded inside matchRoutes.
            // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
            // `new URL()` internally and we need to prevent it from treating
            // them as separators
            navigator.encodeLocation
              ? navigator.encodeLocation(
                  match.pathname
                    .replace(/%/g, "%25")
                    .replace(/\?/g, "%3F")
                    .replace(/#/g, "%23"),
                ).pathname
              : match.pathname,
          ]),
          pathnameBase:
            match.pathnameBase === "/"
              ? parentPathnameBase
              : joinPaths([
                  parentPathnameBase,
                  // Re-encode pathnames that were decoded inside matchRoutes
                  // Pre-encode `%`, `?` and `#` ahead of `encodeLocation` because it uses
                  // `new URL()` internally and we need to prevent it from treating
                  // them as separators
                  navigator.encodeLocation
                    ? navigator.encodeLocation(
                        match.pathnameBase
                          .replace(/%/g, "%25")
                          .replace(/\?/g, "%3F")
                          .replace(/#/g, "%23"),
                      ).pathname
                    : match.pathnameBase,
                ]),
        }),
      ),
    parentMatches,
    dataRouterOpts,
  );

  // When a user passes in a `locationArg`, the associated routes need to
  // be wrapped in a new `LocationContext.Provider` in order for `useLocation`
  // to use the scoped location instead of the global location.
  if (locationArg && renderedMatches) {
    return (
      <LocationContext.Provider
        value={{
          location: {
            pathname: "/",
            search: "",
            hash: "",
            state: null,
            key: "default",
            mask: undefined,
            ...location,
          },
          navigationType: NavigationType.Pop,
        }}
      >
        {renderedMatches}
      </LocationContext.Provider>
    );
  }

  return renderedMatches;
}

function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
  let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };

  let devInfo = null;
  if (ENABLE_DEV_WARNINGS) {
    console.error(
      "Error handled by React Router default ErrorBoundary:",
      error,
    );

    devInfo = (
      <>
        <p>💿 Hey developer 👋</p>
        <p>
          You can provide a way better UX than this when your app throws errors
          by providing your own <code style={codeStyles}>ErrorBoundary</code> or{" "}
          <code style={codeStyles}>errorElement</code> prop on your route.
        </p>
      </>
    );
  }

  return (
    <>
      <h2>Unexpected Application Error!</h2>
      <h3 style={{ fontStyle: "italic" }}>{message}</h3>
      {stack ? <pre style={preStyles}>{stack}</pre> : null}
      {devInfo}
    </>
  );
}

const defaultErrorElement = <DefaultErrorComponent />;

type RenderErrorBoundaryProps = React.PropsWithChildren<{
  location: Location;
  revalidation: RevalidationState;
  error: any;
  component: React.ReactNode;
  routeContext: RouteContextObject;
  onError?: (error: unknown, errorInfo?: React.ErrorInfo) => void;
}>;

type RenderErrorBoundaryState = {
  location: Location;
  revalidation: RevalidationState;
  error: any;
};

export class RenderErrorBoundary extends React.Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  constructor(props: RenderErrorBoundaryProps) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error,
    };
  }

  static contextType = RSCRouterContext;

  static getDerivedStateFromError(error: any) {
    return { error: error };
  }

  static getDerivedStateFromProps(
    props: RenderErrorBoundaryProps,
    state: RenderErrorBoundaryState,
  ) {
    // When we get into an error state, the user will likely click "back" to the
    // previous page that didn't have an error. Because this wraps the entire
    // application, that will have no effect--the error page continues to display.
    // This gives us a mechanism to recover from the error when the location changes.
    //
    // Whether we're in an error state or not, we update the location in state
    // so that when we are in an error state, it gets reset when a new location
    // comes in and the user recovers from the error.
    if (
      state.location !== props.location ||
      (state.revalidation !== "idle" && props.revalidation === "idle")
    ) {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation,
      };
    }

    // If we're not changing locations, preserve the location but still surface
    // any new errors that may come through. We retain the existing error, we do
    // this because the error provided from the app state may be cleared without
    // the location changing.
    return {
      error: props.error !== undefined ? props.error : state.error,
      location: state.location,
      revalidation: props.revalidation || state.revalidation,
    };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    } else {
      console.error(
        "React Router caught the following error during render",
        error,
      );
    }
  }

  render() {
    let error = this.state.error;

    if (
      this.context &&
      typeof error === "object" &&
      error &&
      "digest" in error &&
      typeof error.digest === "string"
    ) {
      const decoded = decodeRouteErrorResponseDigest(error.digest);
      if (decoded) error = decoded;
    }

    let result =
      error !== undefined ? (
        <RouteContext.Provider value={this.props.routeContext}>
          <IsDataRouteContext.Provider
            value={this.props.routeContext.isDataRoute}
          >
            <RouteIdContext.Provider
              value={
                this.props.routeContext.matches[
                  this.props.routeContext.matches.length - 1
                ]?.route.id
              }
            >
              <RouteErrorContext.Provider
                value={error}
                children={this.props.component}
              />
            </RouteIdContext.Provider>
          </IsDataRouteContext.Provider>
        </RouteContext.Provider>
      ) : (
        this.props.children
      );

    if (this.context) {
      return <RSCErrorHandler error={error}>{result}</RSCErrorHandler>;
    }

    return result;
  }
}

const errorRedirectHandledMap = new WeakMap<any, Promise<void>>();

function RSCErrorHandler({
  children,
  error,
}: {
  children: React.ReactNode;
  error: unknown;
}) {
  let { basename, navigator } = React.useContext(NavigationContext);

  if (
    typeof error === "object" &&
    error &&
    "digest" in error &&
    typeof error.digest === "string"
  ) {
    let redirect = decodeRedirectErrorDigest(error.digest);
    if (redirect) {
      let existingRedirect = errorRedirectHandledMap.get(error);
      if (existingRedirect) throw existingRedirect;

      let parsed = parseToInfo(redirect.location, basename);
      let target = parsed.absoluteURL || parsed.to;
      validateNavigationTarget(
        redirect.location,
        target,
        getNavigatorCurrentUrl(navigator),
        "allow-explicit",
      );
      if (hasInvalidProtocol(target)) {
        throw new Error("Invalid redirect location");
      }

      if (isBrowser && !errorRedirectHandledMap.get(error)) {
        if (parsed.isExternal || redirect.reloadDocument) {
          window.location.href = target;
        } else {
          const redirectPromise: Promise<void> = Promise.resolve().then(() =>
            window.__reactRouterDataRouter!.navigate(parsed.to, {
              replace: redirect.replace,
            }),
          );
          errorRedirectHandledMap.set(error, redirectPromise);
          throw redirectPromise;
        }
      }

      return <meta httpEquiv="refresh" content={`0;url=${target}`} />;
    }
  }
  return children;
}

interface RenderedRouteProps {
  routeContext: RouteContextObject;
  match: RouteMatch<string, RouteObject>;
  children: React.ReactNode | null;
}

function RenderedRoute({ routeContext, match, children }: RenderedRouteProps) {
  let dataRouterContext = React.useContext(DataRouterContext);

  // Track how deep we got in our render pass to emulate SSR componentDidCatch
  // in a DataStaticRouter
  if (
    dataRouterContext &&
    dataRouterContext.static &&
    dataRouterContext.staticContext &&
    (match.route.errorElement || match.route.ErrorBoundary)
  ) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }

  return (
    <RouteContext.Provider value={routeContext}>
      <IsDataRouteContext.Provider value={routeContext.isDataRoute}>
        <RouteIdContext.Provider value={match.route.id}>
          {children}
        </RouteIdContext.Provider>
      </IsDataRouteContext.Provider>
    </RouteContext.Provider>
  );
}

export function _renderMatches(
  matches: RouteMatch[] | null,
  parentMatches: RouteMatch[] = [],
  dataRouterOpts?: {
    state: DataRouter["state"];
    isStatic: boolean;
    onError: ClientOnErrorFunction | undefined;
    future: DataRouter["future"];
  },
): React.ReactElement | null {
  let dataRouterState = dataRouterOpts?.state;

  if (matches == null) {
    if (!dataRouterState) {
      return null;
    }

    if (dataRouterState.errors) {
      // Don't bail if we have data router errors so we can render them in the
      // boundary.  Use the pre-matched (or shimmed) matches
      matches = dataRouterState.matches as DataRouteMatch[];
    } else if (
      parentMatches.length === 0 &&
      !dataRouterState.initialized &&
      dataRouterState.matches.length > 0
    ) {
      // Don't bail if we're initializing with partial hydration and we have
      // router matches.  That means we're actively running `patchRoutesOnNavigation`
      // so we should render down the partial matches to the appropriate
      // `HydrateFallback`.  We only do this if `parentMatches` is empty so it
      // only impacts the root matches for `RouterProvider` and no descendant
      // `<Routes>`
      matches = dataRouterState.matches as DataRouteMatch[];
    } else {
      return null;
    }
  }

  let renderedMatches = matches;

  // If we have data errors, trim matches to the highest error boundary
  let errors = dataRouterState?.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex(
      (m) => m.route.id && errors?.[m.route.id] !== undefined,
    );
    invariant(
      errorIndex >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(
        errors,
      ).join(",")}`,
    );
    renderedMatches = renderedMatches.slice(
      0,
      Math.min(renderedMatches.length, errorIndex + 1),
    );
  }

  // If we're in a partial hydration mode, detect if we need to render down to
  // a given HydrateFallback while we load the rest of the hydration data
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterOpts && dataRouterState) {
    renderFallback = dataRouterState.renderFallback;
    for (let i = 0; i < renderedMatches.length; i++) {
      let match = renderedMatches[i];
      // Track the deepest fallback up until the first route without data
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i;
      }

      if (match.route.id) {
        let { loaderData, errors } = dataRouterState;
        let needsToRunLoader =
          match.route.loader &&
          !loaderData.hasOwnProperty(match.route.id) &&
          (!errors || errors[match.route.id] === undefined);
        if (match.route.lazy || needsToRunLoader) {
          // We found the first route that's not ready to render (waiting on
          // lazy, or has a loader that hasn't run yet) - render up until the
          // appropriate fallback
          if (dataRouterOpts.isStatic) {
            renderFallback = true;
          }
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }

  let onErrorHandler = dataRouterOpts?.onError;
  let onError =
    dataRouterState && onErrorHandler
      ? (error: unknown, errorInfo?: React.ErrorInfo) => {
          onErrorHandler(error, {
            location: dataRouterState.location,
            params: dataRouterState.matches?.[0]?.params ?? {},
            pattern: getRoutePattern(dataRouterState.matches),
            errorInfo,
          });
        }
      : undefined;

  return renderedMatches.reduceRight(
    (outlet, match, index) => {
      // Only data routers handle errors/fallbacks
      let error: any;
      let shouldRenderHydrateFallback = false;
      let errorElement: React.ReactNode | null = null;
      let hydrateFallbackElement: React.ReactNode | null = null;
      if (dataRouterState) {
        error = errors && match.route.id ? errors[match.route.id] : undefined;
        errorElement = match.route.errorElement || defaultErrorElement;

        if (renderFallback) {
          if (fallbackIndex < 0 && index === 0) {
            warningOnce(
              "route-fallback",
              false,
              "No `HydrateFallback` element provided to render during initial hydration",
            );
            shouldRenderHydrateFallback = true;
            hydrateFallbackElement = null;
          } else if (fallbackIndex === index) {
            shouldRenderHydrateFallback = true;
            hydrateFallbackElement = match.route.hydrateFallbackElement || null;
          }
        }
      }

      let matches = parentMatches.concat(renderedMatches.slice(0, index + 1));
      let getChildren = () => {
        let children: React.ReactNode;
        if (error) {
          children = errorElement;
        } else if (shouldRenderHydrateFallback) {
          children = hydrateFallbackElement;
        } else if (match.route.Component) {
          // Note: This is a de-optimized path since React won't re-use the
          // ReactElement since it's identity changes with each new
          // React.createElement call.  We keep this so folks can use
          // `<Route Component={...}>` in `<Routes>` but generally `Component`
          // usage is only advised in `RouterProvider` when we can convert it to
          // `element` ahead of time.
          children = <match.route.Component />;
        } else if (match.route.element) {
          children = match.route.element;
        } else {
          children = outlet;
        }

        return (
          <RenderedRoute
            match={match}
            routeContext={{
              outlet,
              matches,
              isDataRoute: dataRouterState != null,
            }}
            children={children}
          />
        );
      };
      // Only wrap in an error boundary within data router usages when we have an
      // ErrorBoundary/errorElement on this route.  Otherwise let it bubble up to
      // an ancestor ErrorBoundary/errorElement
      return dataRouterState &&
        (match.route.ErrorBoundary ||
          match.route.errorElement ||
          index === 0) ? (
        <RenderErrorBoundary
          location={dataRouterState.location}
          revalidation={dataRouterState.revalidation}
          component={errorElement}
          error={error}
          children={getChildren()}
          routeContext={{ outlet: null, matches, isDataRoute: true }}
          onError={onError}
        />
      ) : (
        getChildren()
      );
    },
    null as React.ReactElement | null,
  );
}

function getDataRouterConsoleError(hookName: string) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}

export function useDataRouterContext(hookName: string) {
  let ctx = React.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError(hookName));
  return ctx;
}

export function useDataRouterState(hookName: string) {
  let state = React.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError(hookName));
  return state;
}

export function useDataRouterFetchers(hookName: string) {
  let fetchers = React.useContext(FetchersContext);
  invariant(fetchers, getDataRouterConsoleError(hookName));
  return fetchers;
}

export function useDataRouterData(hookName: string) {
  let data = React.useContext(DataRouterDataContext);
  invariant(data, getDataRouterConsoleError(hookName));
  return data;
}

function useDataRouterNavigation(hookName: string) {
  let navigation = React.useContext(DataRouterNavigationContext);
  invariant(navigation, getDataRouterConsoleError(hookName));
  return navigation;
}

// Internal helper with hookName-aware debugging
export function useCurrentRouteId(hookName: string) {
  let routeId = React.useContext(RouteIdContext);
  invariant(
    routeId,
    `${hookName} can only be used on routes that contain a unique "id"`,
  );
  return routeId;
}

// Omit the fields from each navigation state individually to preserve the discriminated union
type UseNavigationResult =
  UseNavigationResultStates[keyof UseNavigationResultStates];

type UseNavigationResultStates = {
  Idle: Omit<NavigationStates["Idle"], "matches" | "historyAction">;
  Loading: Omit<NavigationStates["Loading"], "matches" | "historyAction">;
  Submitting: Omit<NavigationStates["Submitting"], "matches" | "historyAction">;
};

/**
Returns the current [`Navigation`](https://api.reactrouter.com/v8/types/react-router.Navigation.html), defaulting to an "idle" navigation
when no navigation is in progress. You can use this to render pending UI
(like a global spinner) or read [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
from a form navigation.

```tsx
import { useNavigation } from "react-router";

function SomeComponent() {
  let navigation = useNavigation();
  navigation.state;
  navigation.formData;
  // etc.
}
```

## Signature

```tsx
function useNavigation(): UseNavigationResult
```

## Returns

The current [`Navigation`](https://api.reactrouter.com/v8/types/react-router.Navigation.html) object


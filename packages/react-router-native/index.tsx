import * as React from "react";
import {
  Alert,
  BackHandler,
  GestureResponderEvent,
  Linking,
  TouchableHighlight,
  TouchableHighlightProps
} from "react-native";
import {
  MemoryRouter,
  MemoryRouterProps,
  Navigate,
  NavigateOptions,
  Outlet,
  Route,
  Router,
  Routes,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  resolvePath,
  renderMatches,
  useBlocker,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes
} from "react-router";
import { State, To } from "history";
import URLSearchParams from "@ungap/url-search-params";

////////////////////////////////////////////////////////////////////////////////
// RE-EXPORTS
////////////////////////////////////////////////////////////////////////////////

// Note: Keep in sync with react-router exports!
export {
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  resolvePath,
  renderMatches,
  useBlocker,
  useHref,
  useInRouterContext,
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedPath,
  useRoutes
};

export type {
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
  RoutesProps
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
  UNSAFE_RouteContext
} from "react-router";

////////////////////////////////////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////////////////////////////////////

export interface NativeRouterProps extends MemoryRouterProps {}

/**
 * A <Router> that runs on React Native.
 */
export function NativeRouter(props: NativeRouterProps) {
  return <MemoryRouter {...props} />;
}

export interface LinkProps extends TouchableHighlightProps {
  children?: React.ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  replace?: boolean;
  state?: State;
  to: To;
}

/**
 * A <TouchableHighlight> that navigates to a different URL when touched.
 */
export function Link({
  onPress,
  replace = false,
  state,
  to,
  ...rest
}: LinkProps) {
  let internalOnPress = useLinkPressHandler(to, { replace, state });
  function handlePress(event: GestureResponderEvent) {
    if (onPress) onPress(event);
    if (!event.defaultPrevented) {
      internalOnPress(event);
    }
  }

  return <TouchableHighlight {...rest} onPress={handlePress} />;
}

export interface PromptProps {
  message: string;
  when?: boolean;
}

/**
 * A declarative interface for showing an Alert dialog with the given
 * message when the user tries to navigate away from the current screen.
 *
 * This also serves as a reference implementation for anyone who wants
 * to create their own custom prompt component.
 */
export function Prompt({ message, when }: PromptProps) {
  usePrompt(message, when);
  return null;
}

////////////////////////////////////////////////////////////////////////////////
// HOOKS
////////////////////////////////////////////////////////////////////////////////

const HardwareBackPressEventType = "hardwareBackPress";
const URLEventType = "url";

/**
 * Handles the press behavior for router `<Link>` components. This is useful if
 * you need to create custom `<Link>` compoments with the same press behavior we
 * use in our exported `<Link>`.
 */
export function useLinkPressHandler<S extends State = State>(
  to: To,
  {
    replace,
    state
  }: {
    replace?: boolean;
    state?: S;
  } = {}
): (event: GestureResponderEvent) => void {
  let navigate = useNavigate();
  return function handlePress() {
    navigate(to, { replace, state });
  };
}

/**
 * Enables support for the hardware back button on Android.
 */
export function useHardwareBackButton() {
  React.useEffect(() => {
    function handleHardwardBackPress() {
      return undefined;
      // TODO: The implementation will be something like this
      // if (history.index === 0) {
      //   return false; // home screen
      // } else {
      //   history.back();
      //   return true;
      // }
    }

    BackHandler.addEventListener(
      HardwareBackPressEventType,
      handleHardwardBackPress
    );

    return () => {
      BackHandler.removeEventListener(
        HardwareBackPressEventType,
        handleHardwardBackPress
      );
    };
  }, []);
}

export { useHardwareBackButton as useAndroidBackButton };

/**
 * Enables deep linking, both on the initial app launch and for
 * subsequent incoming links.
 */
export function useDeepLinking() {
  let navigate = useNavigate();

  // Get the initial URL
  React.useEffect(() => {
    let current = true;

    Linking.getInitialURL().then(url => {
      if (current) {
        if (url) navigate(trimScheme(url));
      }
    });

    return () => {
      current = false;
    };
  }, [navigate]);

  // Listen for URL changes
  React.useEffect(() => {
    function handleURLChange(event: { url: string }) {
      navigate(trimScheme(event.url));
    }

    Linking.addEventListener(URLEventType, handleURLChange);

    return () => {
      Linking.removeEventListener(URLEventType, handleURLChange);
    };
  }, [navigate]);
}

function trimScheme(url: string) {
  return url.replace(/^.*?:\/\//, "");
}

/**
 * Prompts the user with an Alert before they leave the current screen.
 */
export function usePrompt(message: string, when = true) {
  let blocker = React.useCallback(
    tx => {
      Alert.alert("Confirm", message, [
        { text: "Cancel", onPress() {} },
        {
          text: "OK",
          onPress() {
            tx.retry();
          }
        }
      ]);
    },
    [message]
  );

  useBlocker(blocker, when);
}

/**
 * A convenient wrapper for accessing individual query parameters via the
 * URLSearchParams interface.
 */
export function useSearchParams(
  defaultInit?: URLSearchParamsInit
): [URLSearchParams, SetURLSearchParams] {
  let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));

  let location = useLocation();
  let searchParams = React.useMemo(() => {
    let searchParams = createSearchParams(location.search);

    for (let key of defaultSearchParamsRef.current.keys()) {
      if (!searchParams.has(key)) {
        defaultSearchParamsRef.current.getAll(key).forEach(value => {
          searchParams.append(key, value);
        });
      }
    }

    return searchParams;
  }, [location.search]);

  let navigate = useNavigate();
  let setSearchParams: SetURLSearchParams = React.useCallback(
    (nextInit, navigateOpts) => {
      navigate("?" + createSearchParams(nextInit), navigateOpts);
    },
    [navigate]
  );

  return [searchParams, setSearchParams];
}

type SetURLSearchParams = (
  nextInit?: URLSearchParamsInit | undefined,
  navigateOpts?: NavigateOptions | undefined
) => void;

export type ParamKeyValuePair = [string, string];

export type URLSearchParamsInit =
  | string
  | ParamKeyValuePair[]
  | Record<string, string | string[]>
  | URLSearchParams;

/**
 * Creates a URLSearchParams object using the given initializer.
 *
 * This is identical to `new URLSearchParams(init)` except it also
 * supports arrays as values in the object form of the initializer
 * instead of just strings. This is convenient when you need multiple
 * values for a given key, but don't want to use an array initializer.
 *
 * For example, instead of:
 *
 *   let searchParams = new URLSearchParams([
 *     ['sort', 'name'],
 *     ['sort', 'price']
 *   ]);
 *
 * you can do:
 *
 *   let searchParams = createSearchParams({
 *     sort: ['name', 'price']
 *   });
 */
export function createSearchParams(
  init: URLSearchParamsInit = ""
): URLSearchParams {
  return new URLSearchParams(
    typeof init === "string" ||
    Array.isArray(init) ||
    init instanceof URLSearchParams
      ? init
      : Object.keys(init).reduce((memo, key) => {
          let value = init[key];
          return memo.concat(
            Array.isArray(value) ? value.map(v => [key, v]) : [[key, value]]
          );
        }, [] as ParamKeyValuePair[])
  );
}

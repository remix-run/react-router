import * as React from 'react';
import PropTypes from 'prop-types';
import {
  // types
  GestureResponderEvent,
  TouchableHighlightProps,
  // modules
  Alert,
  BackHandler,
  Linking,
  TouchableHighlight
} from 'react-native';
import {
  // types
  MemoryRouterProps,
  // components
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  // hooks
  useBlocker,
  useHref,
  useInRouterContext,
  useLocation,
  useLocationPending,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedLocation,
  useRoutes,
  // utils
  createRoutesFromArray,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  resolveLocation
} from 'react-router';
import { State, To } from 'history';
import URLSearchParams from '@ungap/url-search-params';

////////////////////////////////////////////////////////////////////////////////
// RE-EXPORTS
////////////////////////////////////////////////////////////////////////////////

// Note: Keep in sync with react-router exports!
export {
  // components
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  // hooks
  useBlocker,
  useHref,
  useInRouterContext,
  useLocation,
  useLocationPending,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedLocation,
  useRoutes,
  // utils
  createRoutesFromArray,
  createRoutesFromChildren,
  generatePath,
  matchRoutes,
  matchPath,
  resolveLocation
};

////////////////////////////////////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////////////////////////////////////

/**
 * A <Router> that runs on React Native.
 */
export function NativeRouter(props: NativeRouterProps) {
  return <MemoryRouter {...props} />;
}

export interface NativeRouterProps extends MemoryRouterProps {}

if (__DEV__) {
  NativeRouter.displayName = 'NativeRouter';
  NativeRouter.propTypes = MemoryRouter.propTypes;
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
  let navigate = useNavigate();

  function handlePress(event: GestureResponderEvent) {
    if (onPress) onPress(event);
    if (!event.defaultPrevented) {
      navigate(to, { replace, state });
    }
  }

  return <TouchableHighlight {...rest} onPress={handlePress} />;
}

export interface LinkProps extends TouchableHighlightProps {
  onPress?: (event: GestureResponderEvent) => void;
  replace?: boolean;
  state?: State;
  to: To;
}

if (__DEV__) {
  Link.displayName = 'Link';
  Link.propTypes = {
    onPress: PropTypes.func,
    replace: PropTypes.bool,
    state: PropTypes.object,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  };
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

export interface PromptProps {
  message: string;
  when?: boolean;
}

if (__DEV__) {
  Prompt.displayName = 'Prompt';
  Prompt.propTypes = {
    message: PropTypes.string,
    when: PropTypes.bool
  };
}

////////////////////////////////////////////////////////////////////////////////
// HOOKS
////////////////////////////////////////////////////////////////////////////////

const HardwareBackPressEventType = 'hardwareBackPress';
const URLEventType = 'url';

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
  return url.replace(/^.*?:\/\//, '');
}

/**
 * Prompts the user with an Alert before they leave the current screen.
 */
export function usePrompt(message: string, when = true) {
  let blocker = React.useCallback(
    tx => {
      Alert.alert('Confirm', message, [
        { text: 'Cancel', onPress() {} },
        {
          text: 'OK',
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
export function useSearchParams(defaultInit: URLSearchParamsInit) {
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
  let setSearchParams = React.useCallback(
    (nextInit, navigateOpts) => {
      navigate('?' + createSearchParams(nextInit), navigateOpts);
    },
    [navigate]
  );

  return [searchParams, setSearchParams];
}

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
  init: URLSearchParamsInit = ''
): URLSearchParams {
  return new URLSearchParams(
    typeof init === 'string' ||
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

export type ParamKeyValuePair = [string, string];
export type URLSearchParamsInit =
  | string
  | ParamKeyValuePair[]
  | Record<string, string | string[]>
  | URLSearchParams;

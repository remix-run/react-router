import React from 'react';
import PropTypes from 'prop-types';
import { Alert, BackHandler, Linking, TouchableHighlight } from 'react-native';
import URLSearchParams from '@ungap/url-search-params';
import {
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
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedLocation,
  useRoutes,
  // utils
  createRoutesFromChildren,
  matchRoutes,
  resolveLocation,
  generatePath
} from 'react-router';

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
  useLocation,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedLocation,
  useRoutes,
  // utils
  createRoutesFromChildren,
  matchRoutes,
  resolveLocation,
  generatePath
};

////////////////////////////////////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////////////////////////////////////

/**
 * A <Router> that runs on React Native.
 */
export function NativeRouter(props) {
  return <MemoryRouter {...props} />;
}

if (__DEV__) {
  NativeRouter.displayName = 'NativeRouter';
  NativeRouter.propTypes = MemoryRouter.propTypes;
}

/**
 * A <TouchableHighlight> that navigates to a different URL when touched.
 */
export function Link({
  as: Component = TouchableHighlight,
  onPress,
  replace = false,
  state,
  to,
  ...rest
}) {
  let navigate = useNavigate();

  return (
    <Component
      {...rest}
      onPress={event => {
        if (onPress) onPress(event);
        if (!event.defaultPrevented) {
          navigate(to, { replace, state });
        }
      }}
    />
  );
}

if (__DEV__) {
  Link.displayName = 'Link';
  Link.propTypes = {
    as: PropTypes.elementType,
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
export function Prompt({ message, when = false }) {
  usePrompt(message, when);
  return null;
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

/**
 * Enables support for the hardware back button on Android.
 */
export function useHardwareBackButton() {
  let location = useLocation();
  let navigate = useNavigate();

  React.useEffect(() => {
    function handleHardwardBackPress() {
      if (location.index === 0) {
        // do nothing, we're already on the home screen
      } else {
        navigate(-1);
      }

      // TODO
      // if (this.history.index === 0) {
      //   return false; // home screen
      // } else {
      //   this.history.goBack();
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
  }, [location.index, navigate]);
}

export { useHardwareBackButton as useAndroidBackButton };

const URLEventType = 'url';

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
    function handleURLChange(event) {
      navigate(trimScheme(event.url));
    }

    Linking.addEventListener(URLEventType, handleURLChange);

    return () => {
      Linking.removeEventListener(URLEventType, handleURLChange);
    };
  }, [navigate]);
}

function trimScheme(url) {
  return url.replace(/^.*?:\/\//, '');
}

/**
 * Prompts the user with an Alert before they leave the current screen.
 */
export function usePrompt({ message, when = true }) {
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
export function useSearchParams() {
  let location = useLocation();
  let searchParams = React.useMemo(() => new URLSearchParams(location.search), [
    location.search
  ]);
  return searchParams;
}

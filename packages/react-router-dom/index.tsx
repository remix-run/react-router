import React from 'react';
import PropTypes from 'prop-types';
import { createBrowserHistory, createHashHistory } from 'history';
import {
  // components
  MemoryRouter,
  Navigate,
  Outlet,
  Redirect,
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
  Redirect,
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
 * A <Router> for use in web browsers. Provides the cleanest URLs.
 */
export function BrowserRouter({ children, timeout, window }) {
  let historyRef = React.useRef(null);

  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window });
  }

  return (
    <Router
      children={children}
      history={historyRef.current}
      timeout={timeout}
    />
  );
}

if (__DEV__) {
  BrowserRouter.displayName = 'BrowserRouter';
  BrowserRouter.propTypes = {
    children: PropTypes.node,
    timeout: PropTypes.number,
    window: PropTypes.object
  };
}

/**
 * A <Router> for use in web browsers. Stores the location in the hash
 * portion of the URL so it is not sent to the server.
 */
export function HashRouter({ children, timeout, window }) {
  let historyRef = React.useRef(null);

  if (historyRef.current == null) {
    historyRef.current = createHashHistory({ window });
  }

  return (
    <Router
      children={children}
      history={historyRef.current}
      timeout={timeout}
    />
  );
}

if (__DEV__) {
  HashRouter.displayName = 'HashRouter';
  HashRouter.propTypes = {
    children: PropTypes.node,
    timeout: PropTypes.number,
    window: PropTypes.object
  };
}

/**
 * The public API for rendering a history-aware <a>.
 */
export const Link = React.forwardRef(function LinkWithRef(
  {
    as: Component = 'a',
    onClick,
    replace: replaceProp = false,
    state,
    target,
    to,
    ...rest
  },
  ref
) {
  let href = useHref(to);
  let navigate = useNavigate();
  let location = useLocation();
  let toLocation = useResolvedLocation(to);

  function handleClick(event) {
    if (onClick) onClick(event);
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // Ignore everything but left clicks
      (!target || target === '_self') && // Let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // Ignore clicks with modifier keys
    ) {
      event.preventDefault();

      let isSameLocation =
        toLocation.pathname === location.pathname &&
        toLocation.search === location.search &&
        toLocation.hash === location.hash;

      // If the pathname, search, and hash haven't changed, a
      // regular <a> will do a REPLACE instead of a PUSH.
      let replace = !!replaceProp || isSameLocation;

      navigate(to, { replace, state });
    }
  }

  return (
    <Component
      {...rest}
      href={href}
      onClick={handleClick}
      ref={ref}
      target={target}
    />
  );
});

if (__DEV__) {
  Link.displayName = 'Link';
  Link.propTypes = {
    as: PropTypes.elementType,
    onClick: PropTypes.func,
    replace: PropTypes.bool,
    state: PropTypes.object,
    target: PropTypes.string,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string
      })
    ]).isRequired
  };
}

function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
export const NavLink = React.forwardRef(function NavLinkWithRef(
  {
    'aria-current': ariaCurrentProp = 'page',
    activeClassName = 'active',
    activeStyle = null,
    className: classNameProp = '',
    style: styleProp = null,
    to,
    ...rest
  },
  ref
) {
  let match = useMatch(to);
  let ariaCurrent = match ? ariaCurrentProp : undefined;
  let className = [classNameProp, match ? activeClassName : null]
    .filter(Boolean)
    .join(' ');
  let style = {
    ...styleProp,
    ...(match ? activeStyle : null)
  };

  return (
    <Link
      {...rest}
      aria-current={ariaCurrent}
      className={className}
      ref={ref}
      style={style}
      to={to}
    />
  );
});

if (__DEV__) {
  NavLink.displayName = 'NavLink';
  NavLink.propTypes = {
    ...Link.propTypes,
    'aria-current': PropTypes.oneOf([
      'page',
      'step',
      'location',
      'date',
      'time',
      'true'
    ]),
    activeClassName: PropTypes.string,
    activeStyle: PropTypes.object,
    className: PropTypes.string,
    style: PropTypes.object,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string
      })
    ]).isRequired
  };
}

/**
 * A declarative interface for showing a window.confirm dialog with the given
 * message when the user tries to navigate away from the current page.
 *
 * This also serves as a reference implementation for anyone who wants to
 * create their own custom prompt component.
 */
export function Prompt({ message, when }) {
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

/**
 * Prevents navigation away from the current page using a window.confirm prompt
 * with the given message.
 */
export function usePrompt(message, when) {
  let blocker = React.useCallback(
    tx => {
      if (window.confirm(message)) tx.retry();
    },
    [message]
  );

  useBlocker(blocker, when);
}

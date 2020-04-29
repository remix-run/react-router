import * as React from 'react';
import PropTypes from 'prop-types';
import {
  State,
  To,
  BrowserHistory,
  HashHistory,
  createBrowserHistory,
  createHashHistory
} from 'history';
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
  resolveLocation
} from 'react-router';

function warning(cond: boolean, message: string) {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== 'undefined') console.warn(message);

    try {
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

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
  resolveLocation
};

////////////////////////////////////////////////////////////////////////////////
// COMPONENTS
////////////////////////////////////////////////////////////////////////////////

/**
 * A <Router> for use in web browsers. Provides the cleanest URLs.
 */
export function BrowserRouter({
  children,
  timeout,
  window
}: BrowserRouterProps) {
  let historyRef = React.useRef<BrowserHistory | null>(null);

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

export interface BrowserRouterProps {
  children?: React.ReactNode;
  timeout?: number;
  window?: Window;
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
export function HashRouter({ children, timeout, window }: HashRouterProps) {
  let historyRef = React.useRef<HashHistory | null>(null);

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

export interface HashRouterProps {
  children?: React.ReactNode;
  timeout?: number;
  window?: Window;
}

if (__DEV__) {
  HashRouter.displayName = 'HashRouter';
  HashRouter.propTypes = {
    children: PropTypes.node,
    timeout: PropTypes.number,
    window: PropTypes.object
  };
}

function isModifiedEvent(event: React.MouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

/**
 * The public API for rendering a history-aware <a>.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkWithRef(
    { onClick, replace: replaceProp = false, state, target, to, ...rest },
    ref
  ) {
    let href = useHref(to);
    let navigate = useNavigate();
    let location = useLocation();
    let toLocation = useResolvedLocation(to);

    function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
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

export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  replace?: boolean;
  state?: State;
  to: To;
}

if (__DEV__) {
  Link.displayName = 'Link';
  Link.propTypes = {
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

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLinkWithRef(
    {
      'aria-current': ariaCurrentProp = 'page',
      activeClassName = 'active',
      activeStyle,
      className: classNameProp = '',
      style: styleProp,
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
    let style = { ...styleProp, ...(match ? activeStyle : null) };

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
  }
);

export interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  activeStyle?: object;
}

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

/**
 * Prevents navigation away from the current page using a window.confirm prompt
 * with the given message.
 */
export function usePrompt(message: string, when = true) {
  let blocker = React.useCallback(
    tx => {
      if (window.confirm(message)) tx.retry();
    },
    [message]
  );

  useBlocker(blocker, when);
}

/**
 * A convenient wrapper for reading and writing search parameters via the
 * URLSearchParams interface.
 */
export function useSearchParams(defaultInit: URLSearchParamsInit) {
  warning(
    typeof URLSearchParams !== 'undefined',
    'You cannot use the `useSearchParams` hook in a browser that does not' +
      ' support the URLSearchParams API. If you need to support Internet Explorer 11,' +
      ' we recommend you load a polyfill such as https://github.com/ungap/url-search-params' +
      '\n\n' +
      "If you're unsure how to load polyfills, we recommend you check out https://polyfill.io/v3/" +
      ' which provides some recommendations about how to load polyfills only for users that' +
      ' need them, instead of for every user.'
  );

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

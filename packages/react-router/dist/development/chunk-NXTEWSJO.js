"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } } function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }/**
 * react-router v7.14.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */











































var _chunkIK6APEEGjs = require('./chunk-IK6APEEG.js');

// lib/dom/dom.ts
var defaultMethod = "get";
var defaultEncType = "application/x-www-form-urlencoded";
function isHtmlElement(object) {
  return typeof HTMLElement !== "undefined" && object instanceof HTMLElement;
}
function isButtonElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}
function isFormElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}
function isInputElement(object) {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
function isModifiedEvent(event) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
  return event.button === 0 && // Ignore everything but left clicks
  (!target || target === "_self") && // Let browser handle "target=_blank" etc.
  !isModifiedEvent(event);
}
function createSearchParams(init = "") {
  return new URLSearchParams(
    typeof init === "string" || Array.isArray(init) || init instanceof URLSearchParams ? init : Object.keys(init).reduce((memo, key) => {
      let value = init[key];
      return memo.concat(
        Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]
      );
    }, [])
  );
}
function getSearchParamsForLocation(locationSearch, defaultSearchParams) {
  let searchParams = createSearchParams(locationSearch);
  if (defaultSearchParams) {
    defaultSearchParams.forEach((_, key) => {
      if (!searchParams.has(key)) {
        defaultSearchParams.getAll(key).forEach((value) => {
          searchParams.append(key, value);
        });
      }
    });
  }
  return searchParams;
}
var _formDataSupportsSubmitter = null;
function isFormDataSubmitterSupported() {
  if (_formDataSupportsSubmitter === null) {
    try {
      new FormData(
        document.createElement("form"),
        // @ts-expect-error if FormData supports the submitter parameter, this will throw
        0
      );
      _formDataSupportsSubmitter = false;
    } catch (e) {
      _formDataSupportsSubmitter = true;
    }
  }
  return _formDataSupportsSubmitter;
}
var supportedFormEncTypes = /* @__PURE__ */ new Set([
  "application/x-www-form-urlencoded",
  "multipart/form-data",
  "text/plain"
]);
function getFormEncType(encType) {
  if (encType != null && !supportedFormEncTypes.has(encType)) {
    _chunkIK6APEEGjs.warning.call(void 0, 
      false,
      `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${defaultEncType}"`
    );
    return null;
  }
  return encType;
}
function getFormSubmissionInfo(target, basename) {
  let method;
  let action;
  let encType;
  let formData;
  let body;
  if (isFormElement(target)) {
    let attr = target.getAttribute("action");
    action = attr ? _chunkIK6APEEGjs.stripBasename.call(void 0, attr, basename) : null;
    method = target.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(target);
  } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
    let form = target.form;
    if (form == null) {
      throw new Error(
        `Cannot submit a <button> or <input type="submit"> without a <form>`
      );
    }
    let attr = target.getAttribute("formaction") || form.getAttribute("action");
    action = attr ? _chunkIK6APEEGjs.stripBasename.call(void 0, attr, basename) : null;
    method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
    encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
    formData = new FormData(form, target);
    if (!isFormDataSubmitterSupported()) {
      let { name, type, value } = target;
      if (type === "image") {
        let prefix = name ? `${name}.` : "";
        formData.append(`${prefix}x`, "0");
        formData.append(`${prefix}y`, "0");
      } else if (name) {
        formData.append(name, value);
      }
    }
  } else if (isHtmlElement(target)) {
    throw new Error(
      `Cannot submit element that is not <form>, <button>, or <input type="submit|image">`
    );
  } else {
    method = defaultMethod;
    action = null;
    encType = defaultEncType;
    body = target;
  }
  if (formData && encType === "text/plain") {
    body = formData;
    formData = void 0;
  }
  return { action, method: method.toLowerCase(), encType, formData, body };
}

// lib/dom/lib.tsx
var _react = require('react'); var React = _interopRequireWildcard(_react); var React2 = _interopRequireWildcard(_react);
var isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
try {
  if (isBrowser) {
    window.__reactRouterVersion = // @ts-expect-error
    "7.14.0";
  }
} catch (e) {
}
function createBrowserRouter(routes, opts) {
  return _chunkIK6APEEGjs.createRouter.call(void 0, {
    basename: _optionalChain([opts, 'optionalAccess', _2 => _2.basename]),
    getContext: _optionalChain([opts, 'optionalAccess', _3 => _3.getContext]),
    future: _optionalChain([opts, 'optionalAccess', _4 => _4.future]),
    history: _chunkIK6APEEGjs.createBrowserHistory.call(void 0, { window: _optionalChain([opts, 'optionalAccess', _5 => _5.window]) }),
    hydrationData: _optionalChain([opts, 'optionalAccess', _6 => _6.hydrationData]) || parseHydrationData(),
    routes,
    mapRouteProperties: _chunkIK6APEEGjs.mapRouteProperties,
    hydrationRouteProperties: _chunkIK6APEEGjs.hydrationRouteProperties,
    dataStrategy: _optionalChain([opts, 'optionalAccess', _7 => _7.dataStrategy]),
    patchRoutesOnNavigation: _optionalChain([opts, 'optionalAccess', _8 => _8.patchRoutesOnNavigation]),
    window: _optionalChain([opts, 'optionalAccess', _9 => _9.window]),
    unstable_instrumentations: _optionalChain([opts, 'optionalAccess', _10 => _10.unstable_instrumentations])
  }).initialize();
}
function createHashRouter(routes, opts) {
  return _chunkIK6APEEGjs.createRouter.call(void 0, {
    basename: _optionalChain([opts, 'optionalAccess', _11 => _11.basename]),
    getContext: _optionalChain([opts, 'optionalAccess', _12 => _12.getContext]),
    future: _optionalChain([opts, 'optionalAccess', _13 => _13.future]),
    history: _chunkIK6APEEGjs.createHashHistory.call(void 0, { window: _optionalChain([opts, 'optionalAccess', _14 => _14.window]) }),
    hydrationData: _optionalChain([opts, 'optionalAccess', _15 => _15.hydrationData]) || parseHydrationData(),
    routes,
    mapRouteProperties: _chunkIK6APEEGjs.mapRouteProperties,
    hydrationRouteProperties: _chunkIK6APEEGjs.hydrationRouteProperties,
    dataStrategy: _optionalChain([opts, 'optionalAccess', _16 => _16.dataStrategy]),
    patchRoutesOnNavigation: _optionalChain([opts, 'optionalAccess', _17 => _17.patchRoutesOnNavigation]),
    window: _optionalChain([opts, 'optionalAccess', _18 => _18.window]),
    unstable_instrumentations: _optionalChain([opts, 'optionalAccess', _19 => _19.unstable_instrumentations])
  }).initialize();
}
function parseHydrationData() {
  let state = _optionalChain([window, 'optionalAccess', _20 => _20.__staticRouterHydrationData]);
  if (state && state.errors) {
    state = {
      ...state,
      errors: deserializeErrors(state.errors)
    };
  }
  return state;
}
function deserializeErrors(errors) {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized = {};
  for (let [key, val] of entries) {
    if (val && val.__type === "RouteErrorResponse") {
      serialized[key] = new (0, _chunkIK6APEEGjs.ErrorResponseImpl)(
        val.status,
        val.statusText,
        val.data,
        val.internal === true
      );
    } else if (val && val.__type === "Error") {
      if (val.__subType) {
        let ErrorConstructor = window[val.__subType];
        if (typeof ErrorConstructor === "function") {
          try {
            let error = new ErrorConstructor(val.message);
            error.stack = "";
            serialized[key] = error;
          } catch (e) {
          }
        }
      }
      if (serialized[key] == null) {
        let error = new Error(val.message);
        error.stack = "";
        serialized[key] = error;
      }
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}
function BrowserRouter({
  basename,
  children,
  unstable_useTransitions,
  window: window2
}) {
  let historyRef = React.useRef();
  if (historyRef.current == null) {
    historyRef.current = _chunkIK6APEEGjs.createBrowserHistory.call(void 0, { window: window2, v5Compat: true });
  }
  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location
  });
  let setState = React.useCallback(
    (newState) => {
      if (unstable_useTransitions === false) {
        setStateImpl(newState);
      } else {
        React.startTransition(() => setStateImpl(newState));
      }
    },
    [unstable_useTransitions]
  );
  React.useLayoutEffect(() => history.listen(setState), [history, setState]);
  return /* @__PURE__ */ React.createElement(
    _chunkIK6APEEGjs.Router,
    {
      basename,
      children,
      location: state.location,
      navigationType: state.action,
      navigator: history,
      unstable_useTransitions
    }
  );
}
function HashRouter({
  basename,
  children,
  unstable_useTransitions,
  window: window2
}) {
  let historyRef = React.useRef();
  if (historyRef.current == null) {
    historyRef.current = _chunkIK6APEEGjs.createHashHistory.call(void 0, { window: window2, v5Compat: true });
  }
  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location
  });
  let setState = React.useCallback(
    (newState) => {
      if (unstable_useTransitions === false) {
        setStateImpl(newState);
      } else {
        React.startTransition(() => setStateImpl(newState));
      }
    },
    [unstable_useTransitions]
  );
  React.useLayoutEffect(() => history.listen(setState), [history, setState]);
  return /* @__PURE__ */ React.createElement(
    _chunkIK6APEEGjs.Router,
    {
      basename,
      children,
      location: state.location,
      navigationType: state.action,
      navigator: history,
      unstable_useTransitions
    }
  );
}
function HistoryRouter({
  basename,
  children,
  history,
  unstable_useTransitions
}) {
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location
  });
  let setState = React.useCallback(
    (newState) => {
      if (unstable_useTransitions === false) {
        setStateImpl(newState);
      } else {
        React.startTransition(() => setStateImpl(newState));
      }
    },
    [unstable_useTransitions]
  );
  React.useLayoutEffect(() => history.listen(setState), [history, setState]);
  return /* @__PURE__ */ React.createElement(
    _chunkIK6APEEGjs.Router,
    {
      basename,
      children,
      location: state.location,
      navigationType: state.action,
      navigator: history,
      unstable_useTransitions
    }
  );
}
HistoryRouter.displayName = "unstable_HistoryRouter";
var ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
var Link = React.forwardRef(
  function LinkWithRef({
    onClick,
    discover = "render",
    prefetch = "none",
    relative,
    reloadDocument,
    replace,
    unstable_mask,
    state,
    target,
    to,
    preventScrollReset,
    viewTransition,
    unstable_defaultShouldRevalidate,
    ...rest
  }, forwardedRef) {
    let { basename, navigator, unstable_useTransitions } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
    let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX.test(to);
    let parsed = _chunkIK6APEEGjs.parseToInfo.call(void 0, to, basename);
    to = parsed.to;
    let href = _chunkIK6APEEGjs.useHref.call(void 0, to, { relative });
    let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
    let maskedHref = null;
    if (unstable_mask) {
      let resolved = _chunkIK6APEEGjs.resolveTo.call(void 0, 
        unstable_mask,
        [],
        location.unstable_mask ? location.unstable_mask.pathname : "/",
        true
      );
      if (basename !== "/") {
        resolved.pathname = resolved.pathname === "/" ? basename : _chunkIK6APEEGjs.joinPaths.call(void 0, [basename, resolved.pathname]);
      }
      maskedHref = navigator.createHref(resolved);
    }
    let [shouldPrefetch, prefetchRef, prefetchHandlers] = _chunkIK6APEEGjs.usePrefetchBehavior.call(void 0, 
      prefetch,
      rest
    );
    let internalOnClick = useLinkClickHandler(to, {
      replace,
      unstable_mask,
      state,
      target,
      preventScrollReset,
      relative,
      viewTransition,
      unstable_defaultShouldRevalidate,
      unstable_useTransitions
    });
    function handleClick(event) {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) {
        internalOnClick(event);
      }
    }
    let isSpaLink = !(parsed.isExternal || reloadDocument);
    let link = (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      /* @__PURE__ */ React.createElement(
        "a",
        {
          ...rest,
          ...prefetchHandlers,
          href: (isSpaLink ? maskedHref : void 0) || parsed.absoluteURL || href,
          onClick: isSpaLink ? handleClick : onClick,
          ref: _chunkIK6APEEGjs.mergeRefs.call(void 0, forwardedRef, prefetchRef),
          target,
          "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
        }
      )
    );
    return shouldPrefetch && !isAbsolute ? /* @__PURE__ */ React.createElement(React.Fragment, null, link, /* @__PURE__ */ React.createElement(_chunkIK6APEEGjs.PrefetchPageLinks, { page: href })) : link;
  }
);
Link.displayName = "Link";
var NavLink = React.forwardRef(
  function NavLinkWithRef({
    "aria-current": ariaCurrentProp = "page",
    caseSensitive = false,
    className: classNameProp = "",
    end = false,
    style: styleProp,
    to,
    viewTransition,
    children,
    ...rest
  }, ref) {
    let path = _chunkIK6APEEGjs.useResolvedPath.call(void 0, to, { relative: rest.relative });
    let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
    let routerState = React.useContext(_chunkIK6APEEGjs.DataRouterStateContext);
    let { navigator, basename } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
    let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useViewTransitionState(path) && viewTransition === true;
    let toPathname = navigator.encodeLocation ? navigator.encodeLocation(path).pathname : path.pathname;
    let locationPathname = location.pathname;
    let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
    if (!caseSensitive) {
      locationPathname = locationPathname.toLowerCase();
      nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
      toPathname = toPathname.toLowerCase();
    }
    if (nextLocationPathname && basename) {
      nextLocationPathname = _chunkIK6APEEGjs.stripBasename.call(void 0, nextLocationPathname, basename) || nextLocationPathname;
    }
    const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
    let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
    let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
    let renderProps = {
      isActive,
      isPending,
      isTransitioning
    };
    let ariaCurrent = isActive ? ariaCurrentProp : void 0;
    let className;
    if (typeof classNameProp === "function") {
      className = classNameProp(renderProps);
    } else {
      className = [
        classNameProp,
        isActive ? "active" : null,
        isPending ? "pending" : null,
        isTransitioning ? "transitioning" : null
      ].filter(Boolean).join(" ");
    }
    let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
    return /* @__PURE__ */ React.createElement(
      Link,
      {
        ...rest,
        "aria-current": ariaCurrent,
        className,
        ref,
        style,
        to,
        viewTransition
      },
      typeof children === "function" ? children(renderProps) : children
    );
  }
);
NavLink.displayName = "NavLink";
var Form = React.forwardRef(
  ({
    discover = "render",
    fetcherKey,
    navigate,
    reloadDocument,
    replace,
    state,
    method = defaultMethod,
    action,
    onSubmit,
    relative,
    preventScrollReset,
    viewTransition,
    unstable_defaultShouldRevalidate,
    ...props
  }, forwardedRef) => {
    let { unstable_useTransitions } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
    let submit = useSubmit();
    let formAction = useFormAction(action, { relative });
    let formMethod = method.toLowerCase() === "get" ? "get" : "post";
    let isAbsolute = typeof action === "string" && ABSOLUTE_URL_REGEX.test(action);
    let submitHandler = (event) => {
      onSubmit && onSubmit(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      let submitter = event.nativeEvent.submitter;
      let submitMethod = _optionalChain([submitter, 'optionalAccess', _21 => _21.getAttribute, 'call', _22 => _22("formmethod")]) || method;
      let doSubmit = () => submit(submitter || event.currentTarget, {
        fetcherKey,
        method: submitMethod,
        navigate,
        replace,
        state,
        relative,
        preventScrollReset,
        viewTransition,
        unstable_defaultShouldRevalidate
      });
      if (unstable_useTransitions && navigate !== false) {
        React.startTransition(() => doSubmit());
      } else {
        doSubmit();
      }
    };
    return /* @__PURE__ */ React.createElement(
      "form",
      {
        ref: forwardedRef,
        method: formMethod,
        action: formAction,
        onSubmit: reloadDocument ? onSubmit : submitHandler,
        ...props,
        "data-discover": !isAbsolute && discover === "render" ? "true" : void 0
      }
    );
  }
);
Form.displayName = "Form";
function ScrollRestoration({
  getKey,
  storageKey,
  ...props
}) {
  let remixContext = React.useContext(_chunkIK6APEEGjs.FrameworkContext);
  let { basename } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
  let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
  let matches = _chunkIK6APEEGjs.useMatches.call(void 0, );
  useScrollRestoration({ getKey, storageKey });
  let ssrKey = React.useMemo(
    () => {
      if (!remixContext || !getKey) return null;
      let userKey = getScrollRestorationKey(
        location,
        matches,
        basename,
        getKey
      );
      return userKey !== location.key ? userKey : null;
    },
    // Nah, we only need this the first time for the SSR render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  if (!remixContext || remixContext.isSpaMode) {
    return null;
  }
  let restoreScroll = ((storageKey2, restoreKey) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(storageKey2) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error) {
      console.error(error);
      sessionStorage.removeItem(storageKey2);
    }
  }).toString();
  return /* @__PURE__ */ React.createElement(
    "script",
    {
      ...props,
      suppressHydrationWarning: true,
      dangerouslySetInnerHTML: {
        __html: `(${restoreScroll})(${_chunkIK6APEEGjs.escapeHtml.call(void 0, 
          JSON.stringify(storageKey || SCROLL_RESTORATION_STORAGE_KEY)
        )}, ${_chunkIK6APEEGjs.escapeHtml.call(void 0, JSON.stringify(ssrKey))})`
      }
    }
  );
}
ScrollRestoration.displayName = "ScrollRestoration";
function getDataRouterConsoleError(hookName) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}
function useDataRouterContext(hookName) {
  let ctx = React.useContext(_chunkIK6APEEGjs.DataRouterContext);
  _chunkIK6APEEGjs.invariant.call(void 0, ctx, getDataRouterConsoleError(hookName));
  return ctx;
}
function useDataRouterState(hookName) {
  let state = React.useContext(_chunkIK6APEEGjs.DataRouterStateContext);
  _chunkIK6APEEGjs.invariant.call(void 0, state, getDataRouterConsoleError(hookName));
  return state;
}
function useLinkClickHandler(to, {
  target,
  replace: replaceProp,
  unstable_mask,
  state,
  preventScrollReset,
  relative,
  viewTransition,
  unstable_defaultShouldRevalidate,
  unstable_useTransitions
} = {}) {
  let navigate = _chunkIK6APEEGjs.useNavigate.call(void 0, );
  let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
  let path = _chunkIK6APEEGjs.useResolvedPath.call(void 0, to, { relative });
  return React.useCallback(
    (event) => {
      if (shouldProcessLinkClick(event, target)) {
        event.preventDefault();
        let replace = replaceProp !== void 0 ? replaceProp : _chunkIK6APEEGjs.createPath.call(void 0, location) === _chunkIK6APEEGjs.createPath.call(void 0, path);
        let doNavigate = () => navigate(to, {
          replace,
          unstable_mask,
          state,
          preventScrollReset,
          relative,
          viewTransition,
          unstable_defaultShouldRevalidate
        });
        if (unstable_useTransitions) {
          React.startTransition(() => doNavigate());
        } else {
          doNavigate();
        }
      }
    },
    [
      location,
      navigate,
      path,
      replaceProp,
      unstable_mask,
      state,
      target,
      to,
      preventScrollReset,
      relative,
      viewTransition,
      unstable_defaultShouldRevalidate,
      unstable_useTransitions
    ]
  );
}
function useSearchParams(defaultInit) {
  _chunkIK6APEEGjs.warning.call(void 0, 
    typeof URLSearchParams !== "undefined",
    `You cannot use the \`useSearchParams\` hook in a browser that does not support the URLSearchParams API. If you need to support Internet Explorer 11, we recommend you load a polyfill such as https://github.com/ungap/url-search-params.`
  );
  let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));
  let hasSetSearchParamsRef = React.useRef(false);
  let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
  let searchParams = React.useMemo(
    () => (
      // Only merge in the defaults if we haven't yet called setSearchParams.
      // Once we call that we want those to take precedence, otherwise you can't
      // remove a param with setSearchParams({}) if it has an initial value
      getSearchParamsForLocation(
        location.search,
        hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current
      )
    ),
    [location.search]
  );
  let navigate = _chunkIK6APEEGjs.useNavigate.call(void 0, );
  let setSearchParams = React.useCallback(
    (nextInit, navigateOptions) => {
      const newSearchParams = createSearchParams(
        typeof nextInit === "function" ? nextInit(new URLSearchParams(searchParams)) : nextInit
      );
      hasSetSearchParamsRef.current = true;
      navigate("?" + newSearchParams, navigateOptions);
    },
    [navigate, searchParams]
  );
  return [searchParams, setSearchParams];
}
var fetcherId = 0;
var getUniqueFetcherId = () => `__${String(++fetcherId)}__`;
function useSubmit() {
  let { router } = useDataRouterContext("useSubmit" /* UseSubmit */);
  let { basename } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
  let currentRouteId = _chunkIK6APEEGjs.useRouteId.call(void 0, );
  let routerFetch = router.fetch;
  let routerNavigate = router.navigate;
  return React.useCallback(
    async (target, options = {}) => {
      let { action, method, encType, formData, body } = getFormSubmissionInfo(
        target,
        basename
      );
      if (options.navigate === false) {
        let key = options.fetcherKey || getUniqueFetcherId();
        await routerFetch(key, currentRouteId, options.action || action, {
          unstable_defaultShouldRevalidate: options.unstable_defaultShouldRevalidate,
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || method,
          formEncType: options.encType || encType,
          flushSync: options.flushSync
        });
      } else {
        await routerNavigate(options.action || action, {
          unstable_defaultShouldRevalidate: options.unstable_defaultShouldRevalidate,
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || method,
          formEncType: options.encType || encType,
          replace: options.replace,
          state: options.state,
          fromRouteId: currentRouteId,
          flushSync: options.flushSync,
          viewTransition: options.viewTransition
        });
      }
    },
    [routerFetch, routerNavigate, basename, currentRouteId]
  );
}
function useFormAction(action, { relative } = {}) {
  let { basename } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
  let routeContext = React.useContext(_chunkIK6APEEGjs.RouteContext);
  _chunkIK6APEEGjs.invariant.call(void 0, routeContext, "useFormAction must be used inside a RouteContext");
  let [match] = routeContext.matches.slice(-1);
  let path = { ..._chunkIK6APEEGjs.useResolvedPath.call(void 0, action ? action : ".", { relative }) };
  let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
  if (action == null) {
    path.search = location.search;
    let params = new URLSearchParams(path.search);
    let indexValues = params.getAll("index");
    let hasNakedIndexParam = indexValues.some((v) => v === "");
    if (hasNakedIndexParam) {
      params.delete("index");
      indexValues.filter((v) => v).forEach((v) => params.append("index", v));
      let qs = params.toString();
      path.search = qs ? `?${qs}` : "";
    }
  }
  if ((!action || action === ".") && match.route.index) {
    path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
  }
  if (basename !== "/") {
    path.pathname = path.pathname === "/" ? basename : _chunkIK6APEEGjs.joinPaths.call(void 0, [basename, path.pathname]);
  }
  return _chunkIK6APEEGjs.createPath.call(void 0, path);
}
function useFetcher({
  key
} = {}) {
  let { router } = useDataRouterContext("useFetcher" /* UseFetcher */);
  let state = useDataRouterState("useFetcher" /* UseFetcher */);
  let fetcherData = React.useContext(_chunkIK6APEEGjs.FetchersContext);
  let route = React.useContext(_chunkIK6APEEGjs.RouteContext);
  let routeId = _optionalChain([route, 'access', _23 => _23.matches, 'access', _24 => _24[route.matches.length - 1], 'optionalAccess', _25 => _25.route, 'access', _26 => _26.id]);
  _chunkIK6APEEGjs.invariant.call(void 0, fetcherData, `useFetcher must be used inside a FetchersContext`);
  _chunkIK6APEEGjs.invariant.call(void 0, route, `useFetcher must be used inside a RouteContext`);
  _chunkIK6APEEGjs.invariant.call(void 0, 
    routeId != null,
    `useFetcher can only be used on routes that contain a unique "id"`
  );
  let defaultKey = React.useId();
  let [fetcherKey, setFetcherKey] = React.useState(key || defaultKey);
  if (key && key !== fetcherKey) {
    setFetcherKey(key);
  }
  let { deleteFetcher, getFetcher, resetFetcher, fetch: routerFetch } = router;
  React.useEffect(() => {
    getFetcher(fetcherKey);
    return () => deleteFetcher(fetcherKey);
  }, [deleteFetcher, getFetcher, fetcherKey]);
  let load = React.useCallback(
    async (href, opts) => {
      _chunkIK6APEEGjs.invariant.call(void 0, routeId, "No routeId available for fetcher.load()");
      await routerFetch(fetcherKey, routeId, href, opts);
    },
    [fetcherKey, routeId, routerFetch]
  );
  let submitImpl = useSubmit();
  let submit = React.useCallback(
    async (target, opts) => {
      await submitImpl(target, {
        ...opts,
        navigate: false,
        fetcherKey
      });
    },
    [fetcherKey, submitImpl]
  );
  let reset = React.useCallback(
    (opts) => resetFetcher(fetcherKey, opts),
    [resetFetcher, fetcherKey]
  );
  let FetcherForm = React.useMemo(() => {
    let FetcherForm2 = React.forwardRef(
      (props, ref) => {
        return /* @__PURE__ */ React.createElement(Form, { ...props, navigate: false, fetcherKey, ref });
      }
    );
    FetcherForm2.displayName = "fetcher.Form";
    return FetcherForm2;
  }, [fetcherKey]);
  let fetcher = state.fetchers.get(fetcherKey) || _chunkIK6APEEGjs.IDLE_FETCHER;
  let data = fetcherData.get(fetcherKey);
  let fetcherWithComponents = React.useMemo(
    () => ({
      Form: FetcherForm,
      submit,
      load,
      reset,
      ...fetcher,
      data
    }),
    [FetcherForm, submit, load, reset, fetcher, data]
  );
  return fetcherWithComponents;
}
function useFetchers() {
  let state = useDataRouterState("useFetchers" /* UseFetchers */);
  return Array.from(state.fetchers.entries()).map(([key, fetcher]) => ({
    ...fetcher,
    key
  }));
}
var SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
var savedScrollPositions = {};
function getScrollRestorationKey(location, matches, basename, getKey) {
  let key = null;
  if (getKey) {
    if (basename !== "/") {
      key = getKey(
        {
          ...location,
          pathname: _chunkIK6APEEGjs.stripBasename.call(void 0, location.pathname, basename) || location.pathname
        },
        matches
      );
    } else {
      key = getKey(location, matches);
    }
  }
  if (key == null) {
    key = location.key;
  }
  return key;
}
function useScrollRestoration({
  getKey,
  storageKey
} = {}) {
  let { router } = useDataRouterContext("useScrollRestoration" /* UseScrollRestoration */);
  let { restoreScrollPosition, preventScrollReset } = useDataRouterState(
    "useScrollRestoration" /* UseScrollRestoration */
  );
  let { basename } = React.useContext(_chunkIK6APEEGjs.NavigationContext);
  let location = _chunkIK6APEEGjs.useLocation.call(void 0, );
  let matches = _chunkIK6APEEGjs.useMatches.call(void 0, );
  let navigation = _chunkIK6APEEGjs.useNavigation.call(void 0, );
  React.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);
  usePageHide(
    React.useCallback(() => {
      if (navigation.state === "idle") {
        let key = getScrollRestorationKey(location, matches, basename, getKey);
        savedScrollPositions[key] = window.scrollY;
      }
      try {
        sessionStorage.setItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY,
          JSON.stringify(savedScrollPositions)
        );
      } catch (error) {
        _chunkIK6APEEGjs.warning.call(void 0, 
          false,
          `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`
        );
      }
      window.history.scrollRestoration = "auto";
    }, [navigation.state, getKey, basename, location, matches, storageKey])
  );
  if (typeof document !== "undefined") {
    React.useLayoutEffect(() => {
      try {
        let sessionPositions = sessionStorage.getItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY
        );
        if (sessionPositions) {
          savedScrollPositions = JSON.parse(sessionPositions);
        }
      } catch (e) {
      }
    }, [storageKey]);
    React.useLayoutEffect(() => {
      let disableScrollRestoration = _optionalChain([router, 'optionalAccess', _27 => _27.enableScrollRestoration, 'call', _28 => _28(
        savedScrollPositions,
        () => window.scrollY,
        getKey ? (location2, matches2) => getScrollRestorationKey(location2, matches2, basename, getKey) : void 0
      )]);
      return () => disableScrollRestoration && disableScrollRestoration();
    }, [router, basename, getKey]);
    React.useLayoutEffect(() => {
      if (restoreScrollPosition === false) {
        return;
      }
      if (typeof restoreScrollPosition === "number") {
        window.scrollTo(0, restoreScrollPosition);
        return;
      }
      try {
        if (location.hash) {
          let el = document.getElementById(
            decodeURIComponent(location.hash.slice(1))
          );
          if (el) {
            el.scrollIntoView();
            return;
          }
        }
      } catch (e2) {
        _chunkIK6APEEGjs.warning.call(void 0, 
          false,
          `"${location.hash.slice(
            1
          )}" is not a decodable element ID. The view will not scroll to it.`
        );
      }
      if (preventScrollReset === true) {
        return;
      }
      window.scrollTo(0, 0);
    }, [location, restoreScrollPosition, preventScrollReset]);
  }
}
function useBeforeUnload(callback, options) {
  let { capture } = options || {};
  React.useEffect(() => {
    let opts = capture != null ? { capture } : void 0;
    window.addEventListener("beforeunload", callback, opts);
    return () => {
      window.removeEventListener("beforeunload", callback, opts);
    };
  }, [callback, capture]);
}
function usePageHide(callback, options) {
  let { capture } = options || {};
  React.useEffect(() => {
    let opts = capture != null ? { capture } : void 0;
    window.addEventListener("pagehide", callback, opts);
    return () => {
      window.removeEventListener("pagehide", callback, opts);
    };
  }, [callback, capture]);
}
function usePrompt({
  when,
  message
}) {
  let blocker = _chunkIK6APEEGjs.useBlocker.call(void 0, when);
  React.useEffect(() => {
    if (blocker.state === "blocked") {
      let proceed = window.confirm(message);
      if (proceed) {
        setTimeout(blocker.proceed, 0);
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);
  React.useEffect(() => {
    if (blocker.state === "blocked" && !when) {
      blocker.reset();
    }
  }, [blocker, when]);
}
function useViewTransitionState(to, { relative } = {}) {
  let vtContext = React.useContext(_chunkIK6APEEGjs.ViewTransitionContext);
  _chunkIK6APEEGjs.invariant.call(void 0, 
    vtContext != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?"
  );
  let { basename } = useDataRouterContext(
    "useViewTransitionState" /* useViewTransitionState */
  );
  let path = _chunkIK6APEEGjs.useResolvedPath.call(void 0, to, { relative });
  if (!vtContext.isTransitioning) {
    return false;
  }
  let currentPath = _chunkIK6APEEGjs.stripBasename.call(void 0, vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
  let nextPath = _chunkIK6APEEGjs.stripBasename.call(void 0, vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
  return _chunkIK6APEEGjs.matchPath.call(void 0, path.pathname, nextPath) != null || _chunkIK6APEEGjs.matchPath.call(void 0, path.pathname, currentPath) != null;
}

// lib/dom/server.tsx

function StaticRouter({
  basename,
  children,
  location: locationProp = "/"
}) {
  if (typeof locationProp === "string") {
    locationProp = _chunkIK6APEEGjs.parsePath.call(void 0, locationProp);
  }
  let action = "POP" /* Pop */;
  let location = {
    pathname: locationProp.pathname || "/",
    search: locationProp.search || "",
    hash: locationProp.hash || "",
    state: locationProp.state != null ? locationProp.state : null,
    key: locationProp.key || "default",
    unstable_mask: void 0
  };
  let staticNavigator = getStatelessNavigator();
  return /* @__PURE__ */ React2.createElement(
    _chunkIK6APEEGjs.Router,
    {
      basename,
      children,
      location,
      navigationType: action,
      navigator: staticNavigator,
      static: true,
      unstable_useTransitions: false
    }
  );
}
function StaticRouterProvider({
  context,
  router,
  hydrate = true,
  nonce
}) {
  _chunkIK6APEEGjs.invariant.call(void 0, 
    router && context,
    "You must provide `router` and `context` to <StaticRouterProvider>"
  );
  let dataRouterContext = {
    router,
    navigator: getStatelessNavigator(),
    static: true,
    staticContext: context,
    basename: context.basename || "/"
  };
  let fetchersContext = /* @__PURE__ */ new Map();
  let hydrateScript = "";
  if (hydrate !== false) {
    let data = {
      loaderData: context.loaderData,
      actionData: context.actionData,
      errors: serializeErrors(context.errors)
    };
    let json = _chunkIK6APEEGjs.escapeHtml.call(void 0, JSON.stringify(JSON.stringify(data)));
    hydrateScript = `window.__staticRouterHydrationData = JSON.parse(${json});`;
  }
  let { state } = dataRouterContext.router;
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(_chunkIK6APEEGjs.DataRouterContext.Provider, { value: dataRouterContext }, /* @__PURE__ */ React2.createElement(_chunkIK6APEEGjs.DataRouterStateContext.Provider, { value: state }, /* @__PURE__ */ React2.createElement(_chunkIK6APEEGjs.FetchersContext.Provider, { value: fetchersContext }, /* @__PURE__ */ React2.createElement(_chunkIK6APEEGjs.ViewTransitionContext.Provider, { value: { isTransitioning: false } }, /* @__PURE__ */ React2.createElement(
    _chunkIK6APEEGjs.Router,
    {
      basename: dataRouterContext.basename,
      location: state.location,
      navigationType: state.historyAction,
      navigator: dataRouterContext.navigator,
      static: dataRouterContext.static,
      unstable_useTransitions: false
    },
    /* @__PURE__ */ React2.createElement(
      _chunkIK6APEEGjs.DataRoutes,
      {
        routes: router.routes,
        future: router.future,
        state,
        isStatic: true
      }
    )
  ))))), hydrateScript ? /* @__PURE__ */ React2.createElement(
    "script",
    {
      suppressHydrationWarning: true,
      nonce,
      dangerouslySetInnerHTML: { __html: hydrateScript }
    }
  ) : null);
}
function serializeErrors(errors) {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized = {};
  for (let [key, val] of entries) {
    if (_chunkIK6APEEGjs.isRouteErrorResponse.call(void 0, val)) {
      serialized[key] = { ...val, __type: "RouteErrorResponse" };
    } else if (val instanceof Error) {
      serialized[key] = {
        message: val.message,
        __type: "Error",
        // If this is a subclass (i.e., ReferenceError), send up the type so we
        // can re-create the same type during hydration.
        ...val.name !== "Error" ? {
          __subType: val.name
        } : {}
      };
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}
function getStatelessNavigator() {
  return {
    createHref,
    encodeLocation,
    push(to) {
      throw new Error(
        `You cannot use navigator.push() on the server because it is a stateless environment. This error was probably triggered when you did a \`navigate(${JSON.stringify(to)})\` somewhere in your app.`
      );
    },
    replace(to) {
      throw new Error(
        `You cannot use navigator.replace() on the server because it is a stateless environment. This error was probably triggered when you did a \`navigate(${JSON.stringify(to)}, { replace: true })\` somewhere in your app.`
      );
    },
    go(delta) {
      throw new Error(
        `You cannot use navigator.go() on the server because it is a stateless environment. This error was probably triggered when you did a \`navigate(${delta})\` somewhere in your app.`
      );
    },
    back() {
      throw new Error(
        `You cannot use navigator.back() on the server because it is a stateless environment.`
      );
    },
    forward() {
      throw new Error(
        `You cannot use navigator.forward() on the server because it is a stateless environment.`
      );
    }
  };
}
function createStaticHandler2(routes, opts) {
  return _chunkIK6APEEGjs.createStaticHandler.call(void 0, routes, {
    ...opts,
    mapRouteProperties: _chunkIK6APEEGjs.mapRouteProperties
  });
}
function createStaticRouter(routes, context, opts = {}) {
  let manifest = {};
  let dataRoutes = _chunkIK6APEEGjs.convertRoutesToDataRoutes.call(void 0, 
    routes,
    _chunkIK6APEEGjs.mapRouteProperties,
    void 0,
    manifest
  );
  let matches = context.matches.map((match) => {
    let route = manifest[match.route.id] || match.route;
    return {
      ...match,
      route
    };
  });
  let msg = (method) => `You cannot use router.${method}() on the server because it is a stateless environment`;
  return {
    get basename() {
      return context.basename;
    },
    get future() {
      return {
        v8_middleware: false,
        unstable_passThroughRequests: false,
        ..._optionalChain([opts, 'optionalAccess', _29 => _29.future])
      };
    },
    get state() {
      return {
        historyAction: "POP" /* Pop */,
        location: context.location,
        matches,
        loaderData: context.loaderData,
        actionData: context.actionData,
        errors: context.errors,
        initialized: true,
        renderFallback: false,
        navigation: _chunkIK6APEEGjs.IDLE_NAVIGATION,
        restoreScrollPosition: null,
        preventScrollReset: false,
        revalidation: "idle",
        fetchers: /* @__PURE__ */ new Map(),
        blockers: /* @__PURE__ */ new Map()
      };
    },
    get routes() {
      return dataRoutes;
    },
    get window() {
      return void 0;
    },
    initialize() {
      throw msg("initialize");
    },
    subscribe() {
      throw msg("subscribe");
    },
    enableScrollRestoration() {
      throw msg("enableScrollRestoration");
    },
    navigate() {
      throw msg("navigate");
    },
    fetch() {
      throw msg("fetch");
    },
    revalidate() {
      throw msg("revalidate");
    },
    createHref,
    encodeLocation,
    getFetcher() {
      return _chunkIK6APEEGjs.IDLE_FETCHER;
    },
    deleteFetcher() {
      throw msg("deleteFetcher");
    },
    resetFetcher() {
      throw msg("resetFetcher");
    },
    dispose() {
      throw msg("dispose");
    },
    getBlocker() {
      return _chunkIK6APEEGjs.IDLE_BLOCKER;
    },
    deleteBlocker() {
      throw msg("deleteBlocker");
    },
    patchRoutes() {
      throw msg("patchRoutes");
    },
    _internalFetchControllers: /* @__PURE__ */ new Map(),
    _internalSetRoutes() {
      throw msg("_internalSetRoutes");
    },
    _internalSetStateDoNotUseOrYouWillBreakYourApp() {
      throw msg("_internalSetStateDoNotUseOrYouWillBreakYourApp");
    }
  };
}
function createHref(to) {
  return typeof to === "string" ? to : _chunkIK6APEEGjs.createPath.call(void 0, to);
}
function encodeLocation(to) {
  let href = typeof to === "string" ? to : _chunkIK6APEEGjs.createPath.call(void 0, to);
  href = href.replace(/ $/, "%20");
  let encoded = ABSOLUTE_URL_REGEX2.test(href) ? new URL(href) : new URL(href, "http://localhost");
  return {
    pathname: encoded.pathname,
    search: encoded.search,
    hash: encoded.hash
  };
}
var ABSOLUTE_URL_REGEX2 = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;


























exports.createSearchParams = createSearchParams; exports.createBrowserRouter = createBrowserRouter; exports.createHashRouter = createHashRouter; exports.BrowserRouter = BrowserRouter; exports.HashRouter = HashRouter; exports.HistoryRouter = HistoryRouter; exports.Link = Link; exports.NavLink = NavLink; exports.Form = Form; exports.ScrollRestoration = ScrollRestoration; exports.useLinkClickHandler = useLinkClickHandler; exports.useSearchParams = useSearchParams; exports.useSubmit = useSubmit; exports.useFormAction = useFormAction; exports.useFetcher = useFetcher; exports.useFetchers = useFetchers; exports.useScrollRestoration = useScrollRestoration; exports.useBeforeUnload = useBeforeUnload; exports.usePrompt = usePrompt; exports.useViewTransitionState = useViewTransitionState; exports.StaticRouter = StaticRouter; exports.StaticRouterProvider = StaticRouterProvider; exports.createStaticHandler = createStaticHandler2; exports.createStaticRouter = createStaticRouter;

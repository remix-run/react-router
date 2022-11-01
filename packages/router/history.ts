////////////////////////////////////////////////////////////////////////////////
//#region Types and Constants
////////////////////////////////////////////////////////////////////////////////

/**
 * Actions represent the type of change to a location value.
 */
export enum Action {
  /**
   * A POP indicates a change to an arbitrary index in the history stack, such
   * as a back or forward navigation. It does not describe the direction of the
   * navigation, only that the current index changed.
   *
   * Note: This is the default action for newly created history objects.
   */
  Pop = "POP",

  /**
   * A PUSH indicates a new entry being added to the history stack, such as when
   * a link is clicked and a new page loads. When this happens, all subsequent
   * entries in the stack are lost.
   */
  Push = "PUSH",

  /**
   * A REPLACE indicates the entry at the current index in the history stack
   * being replaced by a new one.
   */
  Replace = "REPLACE",
}

/**
 * The pathname, search, and hash values of a URL.
 */
export interface Path {
  /**
   * A URL pathname, beginning with a /.
   */
  pathname: string;

  /**
   * A URL search string, beginning with a ?.
   */
  search: string;

  /**
   * A URL fragment identifier, beginning with a #.
   */
  hash: string;
}

/**
 * An entry in a history stack. A location contains information about the
 * URL path, as well as possibly some arbitrary state and a key.
 */
export interface Location extends Path {
  /**
   * A value of arbitrary data associated with this location.
   */
  state: any;

  /**
   * A unique string associated with this location. May be used to safely store
   * and retrieve data in some other storage API, like `localStorage`.
   *
   * Note: This value is always "default" on the initial location.
   */
  key: string;
}

/**
 * A change to the current location.
 */
export interface Update {
  /**
   * The action that triggered the change.
   */
  action: Action;

  /**
   * The new location.
   */
  location: Location;
}

/**
 * A function that receives notifications about location changes.
 */
export interface Listener {
  (update: Update): void;
}

/**
 * Describes a location that is the destination of some navigation, either via
 * `history.push` or `history.replace`. May be either a URL or the pieces of a
 * URL path.
 */
export type To = string | Partial<Path>;

/**
 * A history is an interface to the navigation stack. The history serves as the
 * source of truth for the current location, as well as provides a set of
 * methods that may be used to change it.
 *
 * It is similar to the DOM's `window.history` object, but with a smaller, more
 * focused API.
 */
export interface History {
  /**
   * The last action that modified the current location. This will always be
   * Action.Pop when a history instance is first created. This value is mutable.
   */
  readonly action: Action;

  /**
   * The current location. This value is mutable.
   */
  readonly location: Location;

  /**
   * Returns a valid href for the given `to` value that may be used as
   * the value of an <a href> attribute.
   *
   * @param to - The destination URL
   */
  createHref(to: To): string;

  /**
   * Encode a location the same way window.history would do (no-op for memory
   * history) so we ensure our PUSH/REPLAC e navigations for data routers
   * behave the same as POP
   *
   * @param location The incoming location from router.navigate()
   */
  encodeLocation(location: Location): Location;

  /**
   * Pushes a new location onto the history stack, increasing its length by one.
   * If there were any entries in the stack after the current one, they are
   * lost.
   *
   * @param to - The new URL
   * @param state - Data to associate with the new location
   */
  push(to: To, state?: any): void;

  /**
   * Replaces the current location in the history stack with a new one.  The
   * location that was replaced will no longer be available.
   *
   * @param to - The new URL
   * @param state - Data to associate with the new location
   */
  replace(to: To, state?: any): void;

  /**
   * Navigates `n` entries backward/forward in the history stack relative to the
   * current index. For example, a "back" navigation would use go(-1).
   *
   * @param delta - The delta in the stack index
   */
  go(delta: number): void;

  /**
   * Sets up a listener that will be called whenever the current location
   * changes.
   *
   * @param listener - A function that will be called when the location changes
   * @returns unlisten - A function that may be used to stop listening
   */
  listen(listener: Listener): () => void;
}

type HistoryState = {
  usr: any;
  key?: string;
};

const PopStateEventType = "popstate";
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Memory History
////////////////////////////////////////////////////////////////////////////////

/**
 * A user-supplied object that describes a location. Used when providing
 * entries to `createMemoryHistory` via its `initialEntries` option.
 */
export type InitialEntry = string | Partial<Location>;

export type MemoryHistoryOptions = {
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  v5Compat?: boolean;
};

/**
 * A memory history stores locations in memory. This is useful in stateful
 * environments where there is no web browser, such as node tests or React
 * Native.
 */
export interface MemoryHistory extends History {
  /**
   * The current index in the history stack.
   */
  readonly index: number;
}

/**
 * Memory history stores the current location in memory. It is designed for use
 * in stateful non-browser environments like tests and React Native.
 */
export function createMemoryHistory(
  options: MemoryHistoryOptions = {}
): MemoryHistory {
  let { initialEntries = ["/"], initialIndex, v5Compat = false } = options;
  let entries: Location[]; // Declare so we can access from createMemoryLocation
  entries = initialEntries.map((entry, index) =>
    createMemoryLocation(
      entry,
      typeof entry === "string" ? null : entry.state,
      index === 0 ? "default" : undefined
    )
  );
  let index = clampIndex(
    initialIndex == null ? entries.length - 1 : initialIndex
  );
  let action = Action.Pop;
  let listener: Listener | null = null;

  function clampIndex(n: number): number {
    return Math.min(Math.max(n, 0), entries.length - 1);
  }
  function getCurrentLocation(): Location {
    return entries[index];
  }
  function createMemoryLocation(
    to: To,
    state: any = null,
    key?: string
  ): Location {
    let location = createLocation(
      entries ? getCurrentLocation().pathname : "/",
      to,
      state,
      key
    );
    warning(
      location.pathname.charAt(0) === "/",
      `relative pathnames are not supported in memory history: ${JSON.stringify(
        to
      )}`
    );
    return location;
  }

  let history: MemoryHistory = {
    get index() {
      return index;
    },
    get action() {
      return action;
    },
    get location() {
      return getCurrentLocation();
    },
    createHref(to) {
      return typeof to === "string" ? to : createPath(to);
    },
    encodeLocation(location) {
      return location;
    },
    push(to, state) {
      action = Action.Push;
      let nextLocation = createMemoryLocation(to, state);
      index += 1;
      entries.splice(index, entries.length, nextLocation);
      if (v5Compat && listener) {
        listener({ action, location: nextLocation });
      }
    },
    replace(to, state) {
      action = Action.Replace;
      let nextLocation = createMemoryLocation(to, state);
      entries[index] = nextLocation;
      if (v5Compat && listener) {
        listener({ action, location: nextLocation });
      }
    },
    go(delta) {
      action = Action.Pop;
      index = clampIndex(index + delta);
      if (listener) {
        listener({ action, location: getCurrentLocation() });
      }
    },
    listen(fn: Listener) {
      listener = fn;
      return () => {
        listener = null;
      };
    },
  };

  return history;
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Browser History
////////////////////////////////////////////////////////////////////////////////

/**
 * A browser history stores the current location in regular URLs in a web
 * browser environment. This is the standard for most web apps and provides the
 * cleanest URLs the browser's address bar.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#browserhistory
 */
export interface BrowserHistory extends UrlHistory {}

export type BrowserHistoryOptions = UrlHistoryOptions;

/**
 * Browser history stores the location in regular URLs. This is the standard for
 * most web apps, but it requires some configuration on the server to ensure you
 * serve the same app at multiple URLs.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createbrowserhistory
 */
export function createBrowserHistory(
  options: BrowserHistoryOptions = {}
): BrowserHistory {
  function createBrowserLocation(
    window: Window,
    globalHistory: Window["history"]
  ) {
    let { pathname, search, hash } = window.location;
    return createLocation(
      "",
      { pathname, search, hash },
      // state defaults to `null` because `window.history.state` does
      (globalHistory.state && globalHistory.state.usr) || null,
      (globalHistory.state && globalHistory.state.key) || "default"
    );
  }

  function createBrowserHref(window: Window, to: To) {
    return typeof to === "string" ? to : createPath(to);
  }

  return getUrlBasedHistory(
    createBrowserLocation,
    createBrowserHref,
    null,
    options
  );
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Hash History
////////////////////////////////////////////////////////////////////////////////

/**
 * A hash history stores the current location in the fragment identifier portion
 * of the URL in a web browser environment.
 *
 * This is ideal for apps that do not control the server for some reason
 * (because the fragment identifier is never sent to the server), including some
 * shared hosting environments that do not provide fine-grained controls over
 * which pages are served at which URLs.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#hashhistory
 */
export interface HashHistory extends UrlHistory {}

export type HashHistoryOptions = UrlHistoryOptions;

/**
 * Hash history stores the location in window.location.hash. This makes it ideal
 * for situations where you don't want to send the location to the server for
 * some reason, either because you do cannot configure it or the URL space is
 * reserved for something else.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createhashhistory
 */
export function createHashHistory(
  options: HashHistoryOptions = {}
): HashHistory {
  function createHashLocation(
    window: Window,
    globalHistory: Window["history"]
  ) {
    let {
      pathname = "/",
      search = "",
      hash = "",
    } = parsePath(window.location.hash.substr(1));
    return createLocation(
      "",
      { pathname, search, hash },
      // state defaults to `null` because `window.history.state` does
      (globalHistory.state && globalHistory.state.usr) || null,
      (globalHistory.state && globalHistory.state.key) || "default"
    );
  }

  function createHashHref(window: Window, to: To) {
    let base = window.document.querySelector("base");
    let href = "";

    if (base && base.getAttribute("href")) {
      let url = window.location.href;
      let hashIndex = url.indexOf("#");
      href = hashIndex === -1 ? url : url.slice(0, hashIndex);
    }

    return href + "#" + (typeof to === "string" ? to : createPath(to));
  }

  function validateHashLocation(location: Location, to: To) {
    warning(
      location.pathname.charAt(0) === "/",
      `relative pathnames are not supported in hash history.push(${JSON.stringify(
        to
      )})`
    );
  }

  return getUrlBasedHistory(
    createHashLocation,
    createHashHref,
    validateHashLocation,
    options
  );
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region UTILS
////////////////////////////////////////////////////////////////////////////////

function warning(cond: any, message: string) {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== "undefined") console.warn(message);

    try {
      // Welcome to debugging history!
      //
      // This error is thrown as a convenience so you can more easily
      // find the source for a warning that appears in the console by
      // enabling "pause on exceptions" in your JavaScript debugger.
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

function createKey() {
  return Math.random().toString(36).substr(2, 8);
}

/**
 * For browser-based histories, we combine the state and key into an object
 */
function getHistoryState(location: Location): HistoryState {
  return {
    usr: location.state,
    key: location.key,
  };
}

/**
 * Creates a Location object with a unique key from the given Path
 */
export function createLocation(
  current: string | Location,
  to: To,
  state: any = null,
  key?: string
): Readonly<Location> {
  let location: Readonly<Location> = {
    pathname: typeof current === "string" ? current : current.pathname,
    search: "",
    hash: "",
    ...(typeof to === "string" ? parsePath(to) : to),
    state,
    // TODO: This could be cleaned up.  push/replace should probably just take
    // full Locations now and avoid the need to run through this flow at all
    // But that's a pretty big refactor to the current test suite so going to
    // keep as is for the time being and just let any incoming keys take precedence
    key: (to && (to as Location).key) || key || createKey(),
  };
  return location;
}

/**
 * Creates a string URL path from the given pathname, search, and hash components.
 */
export function createPath({
  pathname = "/",
  search = "",
  hash = "",
}: Partial<Path>) {
  if (search && search !== "?")
    pathname += search.charAt(0) === "?" ? search : "?" + search;
  if (hash && hash !== "#")
    pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
  return pathname;
}

/**
 * Parses a string URL path into its separate pathname, search, and hash components.
 */
export function parsePath(path: string): Partial<Path> {
  let parsedPath: Partial<Path> = {};

  if (path) {
    let hashIndex = path.indexOf("#");
    if (hashIndex >= 0) {
      parsedPath.hash = path.substr(hashIndex);
      path = path.substr(0, hashIndex);
    }

    let searchIndex = path.indexOf("?");
    if (searchIndex >= 0) {
      parsedPath.search = path.substr(searchIndex);
      path = path.substr(0, searchIndex);
    }

    if (path) {
      parsedPath.pathname = path;
    }
  }

  return parsedPath;
}

export function createURL(location: Location | string): URL {
  // window.location.origin is "null" (the literal string value) in Firefox
  // under certain conditions, notably when serving from a local HTML file
  // See https://bugzilla.mozilla.org/show_bug.cgi?id=878297
  let base =
    typeof window !== "undefined" &&
    typeof window.location !== "undefined" &&
    window.location.origin !== "null"
      ? window.location.origin
      : "unknown://unknown";
  let href = typeof location === "string" ? location : createPath(location);
  return new URL(href, base);
}

export interface UrlHistory extends History {}

export type UrlHistoryOptions = {
  window?: Window;
  v5Compat?: boolean;
};

function getUrlBasedHistory(
  getLocation: (window: Window, globalHistory: Window["history"]) => Location,
  createHref: (window: Window, to: To) => string,
  validateLocation: ((location: Location, to: To) => void) | null,
  options: UrlHistoryOptions = {}
): UrlHistory {
  let { window = document.defaultView!, v5Compat = false } = options;
  let globalHistory = window.history;
  let action = Action.Pop;
  let listener: Listener | null = null;

  function handlePop() {
    action = Action.Pop;
    if (listener) {
      listener({ action, location: history.location });
    }
  }

  function push(to: To, state?: any) {
    action = Action.Push;
    let location = createLocation(history.location, to, state);
    if (validateLocation) validateLocation(location, to);

    let historyState = getHistoryState(location);
    let url = history.createHref(location);

    // try...catch because iOS limits us to 100 pushState calls :/
    try {
      globalHistory.pushState(historyState, "", url);
    } catch (error) {
      // They are going to lose state here, but there is no real
      // way to warn them about it since the page will refresh...
      window.location.assign(url);
    }

    if (v5Compat && listener) {
      listener({ action, location: history.location });
    }
  }

  function replace(to: To, state?: any) {
    action = Action.Replace;
    let location = createLocation(history.location, to, state);
    if (validateLocation) validateLocation(location, to);

    let historyState = getHistoryState(location);
    let url = history.createHref(location);
    globalHistory.replaceState(historyState, "", url);

    if (v5Compat && listener) {
      listener({ action, location: history.location });
    }
  }

  let history: History = {
    get action() {
      return action;
    },
    get location() {
      return getLocation(window, globalHistory);
    },
    listen(fn: Listener) {
      if (listener) {
        throw new Error("A history only accepts one active listener");
      }
      window.addEventListener(PopStateEventType, handlePop);
      listener = fn;

      return () => {
        window.removeEventListener(PopStateEventType, handlePop);
        listener = null;
      };
    },
    createHref(to) {
      return createHref(window, to);
    },
    encodeLocation(location) {
      // Encode a Location the same way window.location would
      let url = createURL(createPath(location));
      return {
        ...location,
        pathname: url.pathname,
        search: url.search,
        hash: url.hash,
      };
    },
    push,
    replace,
    go(n) {
      return globalHistory.go(n);
    },
  };

  return history;
}

//#endregion

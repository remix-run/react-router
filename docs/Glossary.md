## Glossary

This is a glossary of common terms used in the React Router codebase and documentation listed in alphabetical order, along with their [type signatures](http://flowtype.org/docs/quick-reference.html).

### Action

    type Action = 'PUSH' | 'REPLACE' | 'POP';

An *action* describes the type of change to a URL. Possible values are:

  - `PUSH` – indicates a new item was added to the history
  - `REPLACE` – indicates the current item in history was altered
  - `POP` – indicates there is a new current item, i.e. the "current pointer" changed

### Component

    type Component = ReactClass | string;

A *component* is a React component class or a string (e.g. "div"). Basically, it's anything that can be used as the first argument to [`React.createElement`](https://facebook.github.io/react/docs/top-level-api.html#react.createelement).

### EnterHook

    type EnterHook = (nextState: RoutingState, redirectTo: RedirectFunction, callback?: Function) => any;

An *enter hook* is a user-defined function that is called when a route is about to be rendered. It receives the next [routing state](#routingstate) as its first argument. The [`redirectTo` function](#redirectfunction) may be used to trigger a transition to a different URL.

If an enter hook needs to execute asynchronously, it may list a 3rd `callback` argument that it must call in order to cause the transition to proceed.

**Caution:** Using the `callback` in an enter hook causes the transition to wait until it is called. **This can lead to a non-responsive UI if you don't call it very quickly**.

### History

### LeaveHook

    type LeaveHook = () => any;

A *leave hook* is a user-defined function that is called when a route is about to be unmounted.

### Location

    type Location = {
      pathname: Pathname;
      search: QueryString;
      query: Query;
      state: LocationState;
      action: Action;
      key: string;
    };

A *location* answers two important (philosophical) questions:

  - Where am I?
  - How did I get here?

New locations are typically created each time the URL changes. You can read more about locations in [the `history` docs](https://github.com/rackt/history/blob/master/docs/Location.md).

### LocationState

    type LocationState = any;

A *location state* is an arbitrary object of data associated with a particular [`location`](#location). This is basically a way to tie extra state to a location that is not contained in the URL.

This type gets its name from the first argument to HTML5's [`pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState(\)_method) and [`replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState(\)_method) methods.

### Pathname

    type Pathname = string;

A *pathname* is the portion of a URL that describes a hierarchical path, including the preceeding `/`. For example, in `http://example.com/the/path?the=query`, `/the/path` is the pathname. It is synonymous with `window.location.pathname` in web browsers.

### QueryString

    type QueryString = string;

A *query string* is the portion of the URL that follows the [pathname](#pathname), including any preceeding `?`. For example, in `http://example.com/the/path?the=query`, `?the=query` is the query string. It is synonymous with `window.location.search` in web browsers.

### Query

    type Query = Object;

A *query* is the parsed version of a [query string](#querystring).

### Params

    type Params = Object;

The word *params* refers to an object of key/value pairs that were parsed out of the original URL's [pathname](#pathname). The values of this object are typically strings, unless there is more than one param with the same name in which case the value is an array.

### RedirectFunction

    type RedirectFunction = (pathname: Pathname, query: ?Query, state: ?LocationState) => void;

A *redirect function* is used in [`onEnter` hooks](#enterhook) to trigger a transition to a new URL.

### RoutePattern

    type RoutePattern = string;

A *route pattern* (or "path") is a string that describes a portion of a URL. Patterns are compiled into functions that are used to try and match a URL. Patterns may use the following special characters:

  - `:paramName` – matches a URL segment up to the next `/`, `?`, or `#`. The matched string is called a [param](#params)
  - `()` – Wraps a portion of the URL that is optional
  - `*` – Matches all characters (non-greedy) up to the next character in the pattern, or to the end of the URL if there is none, and creates a `splat` param

Route patterns are relative to the pattern of the parent route unless they begin with a `/`, in which case they begin matching at the beginning of the URL.

### Route

    type Route = {
      path: RoutePattern;
      component: Component;
      onEnter: EnterHook;
      onLeave: LeaveHook;
    };

### RoutingState

    type RoutingState = {
      location: Location;
      routes: Array<Route>;
      params: Params;
      components: Array<Component>;
    };

A *routing state* represents the current state of a router. It contains:

  - the current [`location`](#location),
  - an array of [`routes`](#route) that match that location,
  - an object of [`params`](#params) that were parsed out of the URL, and
  - an array of [`components`](#component) that will be rendered to the page in hierarchical order.

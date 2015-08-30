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

    type EnterHook = (nextState: RouterState, redirectTo: RedirectFunction, callback?: Function) => any;

An *enter hook* is a user-defined function that is called when a route is about to be rendered. It receives the next [router state](#routerstate) as its first argument. The [`redirectTo` function](#redirectfunction) may be used to trigger a transition to a different URL.

If an enter hook needs to execute asynchronously, it may list a 3rd `callback` argument that it must call in order to cause the transition to proceed.

**Caution:** Using the `callback` in an enter hook causes the transition to wait until it is called. **This can lead to a non-responsive UI if you don't call it very quickly**.

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
      key: LocationKey;
    };

A *location* answers two important (philosophical) questions:

  - Where am I?
  - How did I get here?

New locations are typically created each time the URL changes. You can read more about locations in [the `history` docs](https://github.com/rackt/history/blob/master/docs/Location.md).

### LocationKey

    type LocationKey = string;

A *location key* is a string that is unique to a particular [`location`](#location). It is the one piece of data that most accurately answers the question "Where am I?".

### LocationState

    type LocationState = ?Object;

A *location state* is an arbitrary object of data associated with a particular [`location`](#location). This is basically a way to tie extra state to a location that is not contained in the URL.

This type gets its name from the first argument to HTML5's [`pushState`][pushState] and [`replaceState`][replaceState] methods.

[pushState]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method
[replaceState]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method

### Path

    type Path = Pathname + QueryString;

A *path* represents a URL path.

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

    type RedirectFunction = (pathname: Pathname | Path, query: ?Query, state: ?LocationState) => void;

A *redirect function* is used in [`onEnter` hooks](#enterhook) to trigger a transition to a new URL.

### Route

    type Route = {
      component: RouteComponent;
      path: ?RoutePattern;
      onEnter: ?EnterHook;
      onLeave: ?LeaveHook;
    };

A *route* specifies a [component](#component) that is part of the user interface (UI). Routes should be nested in a tree-like structure that follows the hierarchy of your components.

It may help to think of a route as an "entry point" into your UI. You don't need a route for every component in your component hierarchy, only for those places where your UI differs based on the URL.

### RouteComponent

    type RouteComponent = Component;

The term *route component* refers to a [component](#component) that is directly rendered by a [route](#route) (i.e. the `<Route component>`). The router creates elements from route components and provides them as `this.props.children` to route components further up the hierarchy. In addition to `children`, route components receive the following props:

  - `router` – The [router](#router) instance
  - `location` – The current [location](#location)
  - `params` – The current [params](#params)
  - `route` – The [route](#route) that declared this component
  - `routeParams` – A subset of the [params](#params) that were specified in the route's [`path`](#routepattern)

### RouteConfig

    type RouteConfig = Array<Route>;

A *route config* is an array of [route](#route)s that specifies the order in which routes should be tried when the router attempts to match a URL.

### RoutePattern

    type RoutePattern = string;

A *route pattern* (or "path") is a string that describes a portion of a URL. Patterns are compiled into functions that are used to try and match a URL. Patterns may use the following special characters:

  - `:paramName` – matches a URL segment up to the next `/`, `?`, or `#`. The matched string is called a [param](#params)
  - `()` – Wraps a portion of the URL that is optional
  - `*` – Matches all characters (non-greedy) up to the next character in the pattern, or to the end of the URL if there is none, and creates a `splat` [param](#params)

Route patterns are relative to the pattern of the parent route unless they begin with a `/`, in which case they begin matching at the beginning of the URL.

### Router

    type Router = {
      transitionTo: (location: Location) => void;
      pushState: (state: ?LocationState, pathname: Pathname | Path, query?: Query) => void;
      replaceState: (state: ?LocationState, pathname: Pathname | Path, query?: Query) => void;
      go(n: Number) => void;
      listen(listener: RouterListener) => Function;
      match(location: Location, callback: RouterListener) => void;
    };

A *router* is a [`history`](http://rackt.github.io/history) object (akin to `window.history` in web browsers) that is used to modify and listen for changes to the URL.

There are two primary interfaces for computing a router's next [state](#routerstate):

- `history.listen` is to be used in stateful environments (such as web browsers) that need to update the UI over a period of time. This method immediately invokes its `listener` argument once and returns a function that must be called to stop listening for changes
- `history.match` is a pure asynchronous function that does not update the history's internal state. This makes it ideal for server-side environments where many requests must be handled concurrently

### RouterListener

    type RouterListener = (error: ?Error, nextState: RouterState) => void;

A *router listener* is a function that is used to listen for changes to a [router](#router)'s [state](#routerstate).

### RouterState

    type RouterState = {
      location: Location;
      routes: Array<Route>;
      params: Params;
      components: Array<Component>;
    };

A *router state* represents the current state of a router. It contains:

  - the current [`location`](#location),
  - an array of [`routes`](#route) that match that location,
  - an object of [`params`](#params) that were parsed out of the URL, and
  - an array of [`components`](#component) that will be rendered to the page in hierarchical order.

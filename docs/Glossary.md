# Glossary

This is a glossary of common terms used in the React Router codebase and documentation listed in alphabetical order, along with their [type signatures](http://flowtype.org/docs/quick-reference.html).

* [Action](#action)
* [Component](#component)
* [EnterHook](#enterhook)
* [Hash](#hash)
* [LeaveHook](#leavehook)
* [Location](#location)
* [LocationDescriptor](#locationdescriptor)
* [LocationKey](#locationkey)
* [LocationState](#locationstate)
* [Params](#params)
* [Path](#path)
* [Pathname](#pathname)
* [Query](#query)
* [QueryString](#querystring)
* [RedirectFunction](#redirectfunction)
* [Route](#route)
* [RouteComponent](#routecomponent)
* [RouteConfig](#routeconfig)
* [RouteHook](#routehook)
* [RoutePattern](#routepattern)
* [Router](#router)
* [RouterState](#routerstate)

## Action

```jsx
type Action = 'PUSH' | 'REPLACE' | 'POP';
```

An *action* describes the type of change to a URL. Possible values are:

  - `PUSH` – indicates a new item was added to the history
  - `REPLACE` – indicates the current item in history was altered
  - `POP` – indicates there is a new current item, i.e. the "current pointer" changed

## Component

```jsx
type Component = ReactClass | string;
```

A *component* is a React component class or a string (e.g. "div"). Basically, it's anything that can be used as the first argument to [`React.createElement`](https://facebook.github.io/react/docs/top-level-api.html#react.createelement).

## EnterHook

```jsx
type EnterHook = (nextState: RouterState, replace: RedirectFunction, callback?: Function) => any;
```

An *enter hook* is a user-defined function that is called when a route is about to be rendered. It receives the next [router state](#routerstate) as its first argument. The [`replace` function](#redirectfunction) may be used to trigger a transition to a different URL.

If an enter hook needs to execute asynchronously, it may list a 3rd `callback` argument that it must call in order to cause the transition to proceed.

**Caution:** Using the `callback` in an enter hook causes the transition to wait until it is called. **This can lead to a non-responsive UI if you don't call it very quickly**.

### Hash

    type Hash = string;

A *hash* is a string that represents the hash portion of the URL. It is synonymous with `window.location.hash` in web browsers.

## LeaveHook

```jsx
type LeaveHook = (prevState: RouterState) => any;
```

A *leave hook* is a user-defined function that is called when a route is about to be unmounted. It receives the previous [router state](#routerstate) as its first argument. 

## Location

```jsx
type Location = {
  pathname: Pathname;
  search: QueryString;
  query: Query;
  state: LocationState;
  action: Action;
  key: LocationKey;
};
```

A *location* answers two important (philosophical) questions:

  - Where am I?
  - How did I get here?

New locations are typically created each time the URL changes. You can read more about locations in [the `history` docs](https://github.com/reactjs/history/blob/master/docs/Location.md).

### LocationDescriptor

    type LocationDescriptorObject = {
      pathname: Pathname;
      search: Search;
      query: Query;
      state: LocationState;
    };

    type LocationDescriptor = LocationDescriptorObject | Path;

A *location descriptor* is the pushable analogue of a location. Locations tell you where you are; you create location descriptors to say where to go.

You can read more about location descriptors in [the `history` docs](https://github.com/reactjs/history/blob/master/docs/Location.md).

## LocationKey

```jsx
type LocationKey = string;
```

A *location key* is a string that is unique to a particular [`location`](#location). It is the one piece of data that most accurately answers the question "Where am I?".

## LocationState

```jsx
type LocationState = ?Object;
```

A *location state* is an arbitrary object of data associated with a particular [`location`](#location). This is basically a way to tie extra state to a location that is not contained in the URL.

This type gets its name from the first argument to HTML5's [`pushState`][pushState] and [`replaceState`][replaceState] methods.

[pushState]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method
[replaceState]: https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method

## Params

```jsx
type Params = Object;
```

The word *params* refers to an object of key/value pairs that were parsed out of the original URL's [pathname](#pathname). The values of this object are typically strings, unless there is more than one param with the same name in which case the value is an array.

## Path

```jsx
type Path = Pathname + QueryString + Hash;
```

A *path* represents a URL path.

## Pathname

```jsx
type Pathname = string;
```

A *pathname* is the portion of a URL that describes a hierarchical path, including the preceding `/`. For example, in `http://example.com/the/path?the=query`, `/the/path` is the pathname. It is synonymous with `window.location.pathname` in web browsers.

## Query

```jsx
type Query = Object;
```

A *query* is the parsed version of a [query string](#querystring).

## QueryString

```jsx
type QueryString = string;
```

A *query string* is the portion of the URL that follows the [pathname](#pathname), including any preceding `?`. For example, in `http://example.com/the/path?the=query`, `?the=query` is the query string. It is synonymous with `window.location.search` in web browsers.

## RedirectFunction

```jsx
type RedirectFunction = (state: ?LocationState, pathname: Pathname | Path, query: ?Query) => void;
```

A *redirect function* is used in [`onEnter` hooks](#enterhook) to trigger a transition to a new URL.

## Route

```jsx
type Route = {
  component: RouteComponent;
  path: ?RoutePattern;
  onEnter: ?EnterHook;
  onLeave: ?LeaveHook;
};
```

A *route* specifies a [component](#component) that is part of the user interface (UI). Routes should be nested in a tree-like structure that follows the hierarchy of your components.

It may help to think of a route as an "entry point" into your UI. You don't need a route for every component in your component hierarchy, only for those places where your UI differs based on the URL.

## RouteComponent

```jsx
type RouteComponent = Component;
```

The term *route component* refers to a [component](#component) that is directly rendered by a [route](#route) (i.e. the `<Route component>`). The router creates elements from route components and provides them as `this.props.children` to route components further up the hierarchy. In addition to `children`, route components receive the following props:

  - `router` – The [router](#router) instance
  - `location` – The current [location](#location)
  - `params` – The current [params](#params)
  - `route` – The [route](#route) that declared this component
  - `routeParams` – A subset of the [params](#params) that were specified in the route's [`path`](#routepattern)

Route components should generally be component classes rather than strings. This will avoid potential issues with passing the injected props above to DOM components.

## RouteConfig

```jsx
type RouteConfig = Array<Route>;
```

A *route config* is an array of [route](#route)s that specifies the order in which routes should be tried when the router attempts to match a URL.

## RouteHook

```jsx
type RouteHook = (nextLocation?: Location) => any;
```

A *route hook* is a function that is used to prevent the user from leaving a route. On normal transitions, it receives the next [location](#location) as an argument and must either `return false` to cancel the transition or `return` a prompt message to show the user. When invoked during the `beforeunload` event in web browsers, it does not receive any arguments and must `return` a prompt message to cancel the transition.

## RoutePattern

```jsx
type RoutePattern = string;
```

A *route pattern* (or "path") is a string that describes a portion of a URL. Patterns are compiled into functions that are used to try and match a URL. Patterns may use the following special characters:

  - `:paramName` – matches a URL segment up to the next `/`, `?`, or `#`. The matched string is called a [param](#params)
  - `()` – Wraps a portion of the URL that is optional
  - `*` – Matches all characters (non-greedy) up to the next character in the pattern, or to the end of the URL if there is none, and creates a `splat` [param](#params)
  - `**` - Matches all characters (greedy) until the next `/`, `?`, or `#` and creates a `splat` [param](#params)

Route patterns are relative to the pattern of the parent route unless they begin with a `/`, in which case they begin matching at the beginning of the URL.

## Router

```jsx
type Router = {
  push(location: LocationDescriptor) => void;
  replace(location: LocationDescriptor) => void;
  go(n: number) => void;
  goBack() => void;
  goForward() => void;
  setRouteLeaveHook(route: Route, hook: RouteHook) => Function;
  isActive(location: LocationDescriptor, indexOnly: boolean) => void;
};
```

A *router* object allows for procedural manipulation of the routing state.

## RouterState

```jsx
type RouterState = {
  location: Location;
  routes: Array<Route>;
  params: Params;
  components: Array<Component>;
};
```

A *router state* represents the current state of a router. It contains:

  - the current [`location`](#location),
  - an array of [`routes`](#route) that match that location,
  - an object of [`params`](#params) that were parsed out of the URL, and
  - an array of [`components`](#component) that will be rendered to the page in hierarchical order.

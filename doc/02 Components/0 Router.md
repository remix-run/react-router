Primary component of React Router. It keeps your UI and the URL in sync.


Props
-----

### `children` (required)

One or many [`Routes`][Route] or [Plain Routes][PlainRoute]. When the
history changes, `Router` will match a branch of its [`Routes`][Route],
and render their configured [components][RouteComponent], with child
route components nested inside the parents.

### `routes`

Alias for `children`.

### `history`

The [`History`][History] the router should set up and listen for changes
on. When the history gets new entries, the router will update its state
and render.

### `createElement(Component, props)`

When the router is ready to render a branch of route components, it will
use this function to create the elements. You may want to take control
of creating the elements when you're using some sort of data
abstraction, like setting up subscriptions to stores, or passing in some
sort of application module to each component via props.

### `stringifyQuery(query)`

A function that should be used to convert an object to a URL query string.
By default, this function uses `qs.stringify(query, { arrayFormat: 'brackets' })`.


#### Examples

```js
<Router createElement={createElement}/>

// default behavior
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <Component {...props}/>
}

// maybe you're using something like Relay
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <RelayContainer Component={Component} routerProps={props}/>;
}
```

### `onError(error)`

While the router is matching, errors may bubble up, here
is your opportunity to catch and deal with them. Typically these will
come from async features like `route.getComponents` and
`route.getChildRoutes`.

### `onUpdate()`

Called whenever the router updates its state in response to URL changes.


Methods
-------

### `transitionTo(pathname, query, state)`

Transitions to a new URL.

Usually called from the [`Navigation`][Navigation] mixin or transition hooks.

#### arguments

- `pathname` - the full url with or without the query
- `query` - an object that will be [stringified][stringifyQuery] by the router.
- `state` - the [location state][location.state].

#### Examples

```js
router.transitionTo('/users/123');
router.transitionTo('/users/123', {showGrades: true}); // -> /users/123?showGrades=true
router.transitionTo('/pictures/123', null, { fromDashboard: true });
```

### `replaceWith(pathname, query, state)`

Replaces the current URL with a new one, without affecting the length of
the history (like a redirect).

Usually called from the [`Navigation`][Navigation] mixin or transition hooks.

#### arguments

- `pathname` - the full url with or without the query
- `query` - an object that will be [stringified][stringifyQuery] by the router.
- `state` - the [location state][location.state].

#### Examples

```js
router.replaceWith('/users/123');
router.replaceWith('/users/123', {showGrades: true}); // -> /users/123?showGrades=true
router.replaceWith('/pictures/123', null, { fromDashboard: true });
```

### `go(n)`

Go forward or backward in the history by `n` or `-n`.

### `goBack()`

Go back one entry in the history.

### `goForward()`

Go forward one entry in the history.

### `addTransitionHook(fn)`

Add a function to be called when the router attempts to transition away
from the current location.

You may find the [`TransitionHook`][TransitionHook] mixin more
convienient.

#### arguments

- `fn(nextState, router, cb)`
  - `nextState` - the next rendering state of the router.
  - `router` - the `Router` instance
  - `cb(err)` - call this when you are finished doing transition work

### `removeTransitionHook(fn)`

Removes a function `fn` previously added as a transition hook.

You may find the [`TransitionHook`][TransitionHook] mixin more
convienient.

### `cancelTransition()`

Cancels an active transition.

### `isActive(pathname, query)`

Returns `true` or `false` depending on if the current path is active.
Will be true for every route in the route branch matched by the
`pathname` (child route is active, therefore parent is too).

### `makePath(pathname, query)`

Stringifies the query into the pathname, using the router's config.

### `makeHref(pathname, query)`

Makes a URL, using the router's config. For example, it will add `#/` in
front of the `pathname` for `HashHistory`.


Static Methods
--------------

### `match(routes, history, cb)`

The router works by listening to a history for changes, matches the url
to routes, and then sets state for rendering. On the server you will
need to calculate that state before rendering with `Router.match`. It
will call back with a bag of initial state that you pass to the router.

#### Example

```js
var history = new ServerHistory(req.path);
Router.match(routes, history, (err, initialState) => {
  React.renderToString(<Router children={routes} history={history} {...initialState}/>);
});
```

Examples
--------

Please see the `examples/` directory of the repository for extensive
exampls of using `Router`.

```js
import { Router, Route } from 'react-router';
import BrowserHistory from 'react-router/lib/BrowserHistory';

React.render((
  <Router history={BrowserHistory}>
    <Route path="about" component={About}/>
    <Route path="dashboard" component={Dashboard}/>
  </Router>
), document.body);
```

  [Route]:#TODO
  [PlainRoute]:#TODO
  [History]:#TODO
  [RouteComponent]:#TODO
  [Link]:#TODO
  [transitionTo]:#TODO
  [Router.match]:#TODO
  [Navigation]:#TODO
  [stringifyQuery]:#TODO
  [location.state]:#TODO
  [TransitionHook]:#TODO


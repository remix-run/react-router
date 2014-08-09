API: `Router`
=============

The main export, `Router`, contains several methods that may be used to
navigate around the application.

```js
// cjs modules
var Router = require('react-router')

// or global build
window.ReactRouter
```

Methods
-------

### `transitionTo(routeNameOrPath, [params[, query]])`

Programmatically transition to a new route.

#### Examples

```js
Router.transitionTo('user', {id: 10}, {showAge: true});
Router.transitionTo('about');
Router.transitionTo('/users/10?showAge=true');
```

### `replaceWith(routeNameOrPath, [params[, query]])`

Programmatically replace current route with a new route. Does not add an
entry into the browser history.

#### Examples

```js
Router.replaceWith('user', {id: 10}, {showAge: true});
Router.replaceWith('about');
Router.replaceWith('/users/10?showAge=true');
```

### `goBack()`

Programmatically go back to the last route and remove the most recent
entry from the browser history.

#### Example

```js
Router.goBack();
```

### `makeHref(routeName, params, query)`

Creates an `href` to a route. Use this along with `ActiveState` when you
need to build components similar to `Link`.

#### Example

```js
// given a route like this:
<Route name="user" path="users/:userId"/>
Router.makeHref('user', {userId: 123}); // "users/123"
```

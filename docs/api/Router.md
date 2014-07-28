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

Programatically transition to a new route.

#### Examples

```js
Router.transitionTo('user', {id: 10}, {showAge: true});
Router.transitionTo('about');
Router.transitionTo('/users/10?showAge=true');
```

### `replaceWith(routeName, [params[, query]])`

Programatically replace current route with a new route. Does not add an
entry into the browser history.

#### Examples

```js
Router.replaceWith('user', {id: 10}, {showAge: true});
Router.replaceWith('about');
Router.replaceWith('/users/10?showAge=true');
```

### `goBack()`

Programatically go back to the last route and remove the most recent
entry from the browser history.

#### Example

```js
Router.goBack();
```


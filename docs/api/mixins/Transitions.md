API: `Transitions` (mixin)
==========================

A mixin for components that need to initiate transitions to other routes.

Instance Methods
----------------

### `transitionTo(routeNameOrPath, [params[, query]])`

Programmatically transition to a new route.

#### Examples

```js
this.transitionTo('user', {id: 10}, {showAge: true});
this.transitionTo('about');
this.transitionTo('/users/10?showAge=true');
this.transitionTo('http://example.com/users/10?showAge=true');
```

### `replaceWith(routeNameOrPath, [params[, query]])`

Programmatically replace current route with a new route. Does not add an
entry into the browser history.

#### Examples

```js
this.replaceWith('user', {id: 10}, {showAge: true});
this.replaceWith('about');
this.replaceWith('/users/10?showAge=true');
```

### `goBack()`

Programmatically go back to the last route and remove the most recent
entry from the browser history.

#### Example

```js
this.goBack();
```

### `makeHref(routeName, params, query)`

Creates an `href` to a route. Use this along with `ActiveState` when you
need to build components similar to `Link`.

#### Example

```js
// given a route like this:
// <Route name="user" path="users/:userId"/>
this.makeHref('user', {userId: 123}); // "users/123"
```

Example
-------

```js
React.createClass({
  mixins: [Transitions],

  whenever: function() {
    this.transitionTo('something');
    this.replaceWith('something');
    this.goBack();
  }
});
```


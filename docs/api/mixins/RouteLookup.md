API: `RouteLookup` (mixin)
==========================

A mixin for components that need to lookup routes and/or build URL paths
and links.

Instance Methods
----------------

### `getRoutes()`

Returns an array of all routes.

```js
[route, route, ...]
```

### `getNamedRoutes()`

Returns an object hash of all routes by name.

```js
{user: route, users: route, ...}
```

### `getRouteByName(routeName)`

Returns the route with the given `routeName`, `null` if no such route exists.

Example
-------

```js
React.createClass({
  mixins: [RouteLookup],

  componentDidMount: function() {
    console.log(this.getRoutes())
  }
});
```


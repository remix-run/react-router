API: `RouteLookup` (mixin)
==========================

A mixin for components that need to lookup routes and/or build URL paths
and links.

Instance Methods
----------------

### `getRoutes()`

Returns an array of the active routes in order of their hierarchy.

```js
[route, route, ...]
```

### `getNamedRoutes()`

Returns an object hash of active routes by name.

```js
{user: route, users: route, ...}
```

### `getRouteByName(routeName)`

Returns the route with the given `routeName`, `null` if no such route exists.

Example
-------

```js
var TopLevelApp = React.createClass({
  mixins: [RouteLookup, PathState],

  // `updatePath` is from `PathState`
  updatePath: function() {
    var deepestRoute = this.getRoutes().reverse()[0];
    document.title = deepestRoute.props.title;
  }
});
```


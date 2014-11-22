API: `Router.create`
====================

Creates a router. Useful to pass around your app to be able to call
`transitionTo` and friends w/o being inside of a component.

Signature
---------

`Router.create(options)`

Options
-------

### routes

A set of routes.

### location

The location to use.

### scrollBehavior

The scroll behavior to use.

Methods
-------

### `run(callback)`

Runs the router, the same as the more common `Router.run` method.

Example
-------

```js
// the more common API is
Router.run(routes, Router.HistoryLocation, callback);

// which is just a shortcut for
var router = Router.create({
  routes: routes,
  location: Router.HistoryLocation
});
router.run(callback);
```

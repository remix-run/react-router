Creates a new router. Useful to pass around your app to be able to call
`transitionTo` and friends w/o being inside of a component.

Signature
---------

`Router.create(options)`

Options
-------

### `routes`

### `location`

### `scrollBehavior`

### `onAbort`

Used server-side to know when a route was redirected.

Methods
-------

### `run(callback)`

Runs the router, the same as `Router.run`.

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

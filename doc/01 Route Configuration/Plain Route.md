A route configuration object. `Router` turns JSX `<Route/>`s into
these objects, but you can use them direclty if you prefer. All of the
props are the same as `<Route/>` props, except those listed here.

Props
-----

### `childRoutes`

An array of child routes, same as `children` in JSX route configs.

### `getChildRoutes(callback)`

Same as `childRoutes` but asynchronous:

#### `callback` signature

`cb(err, routesArray)`

#### Example

```js
var myRoute = {
  path: 'course/:courseId',
  childRoutes: [
    announcementsRoute,
    gradesRoute,
    assignmentsRoute
  ]
};

// async child routes
var myRoute = {
  path: 'course/:courseId',
  getChildRoutes (cb) {
    // do asynchronous stuff to find the child routes
    cb(null, [announcementsRoute, gradesRoute, assignmentsRoute]);
  }
};
```


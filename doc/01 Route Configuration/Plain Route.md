A route configuration object. `Router` turns JSX `<Route/>`s into
these objects, but you can use them directly if you prefer. All of the
props are the same as `<Route/>` props, except those listed here.

Props
-----

### `childRoutes`

An array of child routes, same as `children` in JSX route configs.

### `getChildRoutes(state, callback)`

Same as `childRoutes` but asynchronous and receives the location state.
Useful for code-splitting and dynamic route matching (given some state
or session data to return a different set of child routes).

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
  getChildRoutes (state, cb) {
    // do asynchronous stuff to find the child routes
    cb(null, [announcementsRoute, gradesRoute, assignmentsRoute]);
  }
};

// navigation dependent child routes
// can link with some state
<Link to="/picture/123" state={{fromDashboard: true}}/>

var myRoute = {
  path: 'picture/:id',
  getChildRoutes (state, cb) {
    // state gets passed to `getChildRoutes`
    if (state && state.fromDashboard)
      cb(null, [dashboardPictureRoute])
    else
      cb(null, [pictureRoute])
  }
};
```


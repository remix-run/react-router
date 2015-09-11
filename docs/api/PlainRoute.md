# Plain Route

A plain JavaScript object route definition. `Router` turns JSX
`<Route/>`s into these objects, but you can use them directly if you
prefer. All of the props are the same as `<Route/>` props, except
those listed here.

### Props

#### `childRoutes`

An array of child routes, same as `children` in JSX route configs.

#### `getChildRoutes(location, callback)`

Same as `childRoutes` but asynchronous and receives the `location`.
Useful for code-splitting and dynamic route matching (given some state
or session data to return a different set of child routes).

##### `callback` signature

`cb(err, routesArray)`

### Examples

```js
let myRoute = {
  path: 'course/:courseId',
  childRoutes: [
    announcementsRoute,
    gradesRoute,
    assignmentsRoute
  ]
};

// async child routes
let myRoute = {
  path: 'course/:courseId',
  getChildRoutes (location, cb) {
    // do asynchronous stuff to find the child routes
    cb(null, [announcementsRoute, gradesRoute, assignmentsRoute]);
  }
};

// navigation dependent child routes
// can link with some state
<Link to="/picture/123" state={{fromDashboard: true}}/>

let myRoute = {
  path: 'picture/:id',
  getChildRoutes (location, cb) {
    let { state } = location
    if (state && state.fromDashboard)
      cb(null, [dashboardPictureRoute])
    else
      cb(null, [pictureRoute])
  }
};
```
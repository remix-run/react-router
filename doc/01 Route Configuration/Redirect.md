A `Redirect` sets up a redirect to another route in your application to
maintain old URLs.

Props
-----

### `from`

The path you want to redirect from, including dynamic segments.

### `to`

The route path you want to redirect to.

### `params`

By default, the parameters will just pass through to the new route, but
you can specify them if you need to (usually you shouldn't).

### `query`

By default, the query parameters will just pass through to the new
route, but you can specify them if you need to (usually you shouldn't).

Example
-------

```js
// lets say we want to change from `/profile/123` to `/about/123`
// and redirect `/get-in-touch` to `/contact`
<Route component={App}>
  <Route path="contact" component={Contact}/>
  <Route path="about/:userId" component={UserProfile}/>
  <Route path="course/:courseId">
    <Route path="dashboard" component={Dashboard}/>
    <Route path="assignments" component={Assignments}/>
  </Route>

  {/* `/get-in-touch` -> `/contact` */}
  <Redirect from="/get-in-touch" to="/contact" />

  {/* `/profile/123` -> `/about/123` */}
  <Redirect from="/profile/:userId" to="/about/:userId" />

  {/* `/profile/me` -> `/about/123` */}
  <Redirect from="/profile/me" to="/about/:userId" params={{userId: SESSION.USER_ID}}/>
</Route>
```

Note that the `<Redirect/>` can be placed anywhere in the route
hierarchy, if you'd prefer the redirects to be next to their respective
routes, the `from` path will match the same as a regular route `path`.
Currently, the `to` property of `<Redirect/>` cannot be relative.

```js
<Route path="course/:courseId">
  <Route path="dashboard"/>
  {/* /course/123/home -> /course/123/dashboard */}
  <Redirect from="home" to="/course/:courseId/dashboard" />
</Route>
```

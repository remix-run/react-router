A `Redirect` sets up a redirect to another route in your application to
maintain old URLs.

Props
-----

### `from`

The path you want to redirect from, including dynamic segments. Defaults
to `*` so you can redirect anything not found to somewhere else.

### `to`

The `name` of the route you want to redirect to.

### `params`

By default, the parameters will just pass through to the new route, but
you can specify them if you need to (usually you shouldn't).

### `query`

By default, the query parameters will just pass through to the new
route, but you can specify them if you need to (usually you shouldn't).

Example
-------

```xml
<!--
  lets say we want to change from `/profile/123` to `/about/123`
  and redirect `/get-in-touch` to `/contact`
-->
<Route handler={App}>
  <Route name="contact" handler={Contact}/>
  <Route name="about-user" path="about/:userId" handler={UserProfile}/>
  <Route name="course" path="course/:courseId">
    <Route name="course-dashboard" path="dashboard" handler={Dashboard}/>
    <Route name="course-assignments" path="assignments" handler={Assignments}/>
  </Route>

  <!-- `/get-in-touch` -> `/contact` -->
  <Redirect from="get-in-touch" to="contact" />

  <!-- `/profile/123` -> `/about/123` -->
  <Redirect from="profile/:userId" to="about-user" />

  <!-- `/profile/me` -> `/about-user/123` -->
  <Redirect from="profile/me" to="about-user" params={{userId: SESSION.USER_ID}} />
</Route>
```

Note that the `<Redirect/>` can be placed anywhere in the route
hierarchy, if you'd prefer the redirects to be next to their respective
routes, the `from` path will match the same as a regular route `path`.

```xml
<Route handler={App}>
  <Route name="course" path="course/:courseId">
    <Route name="course-dashboard" path="dashboard" handler={Dashboard}/>
    <!-- /course/123/home -> /course/123/dashboard -->
    <Redirect from="home" to="course-dashboard" />
  </Route>
</Route>
```


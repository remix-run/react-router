API: `NotFoundRoute` (component)
===============================

When a parent's URL partially matches, but none of the children do, a
`NotFoundRoute` will be matched and its handler activated at any level
of your route hierarchy.

Props
-----

See [Route::props][routeProps]

Example
-------

```xml
<Route path="/" handler={App}>
  <Route name="course" path="course/:courseId" handler={Course}>
    <Route name="course-dashboard" path="dashboard" handler={Dashboard}/>

    <!-- ie: `/course/123/foo` -->
    <NotFoundRoute handler={CourseRouteNotFound} />
  </Route>

  <!-- ie: `/flkjasdf` -->
  <NotFoundRoute handler={NotFound} />
</Route>
```

The last `NotFoundRoute` will render inside the `App`, the first will
rendering inside of `Course`.

  [routeProps]:/docs/api/components/Route.md#props


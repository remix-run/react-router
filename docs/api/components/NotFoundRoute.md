API: `NotFoundRoute` (component)
===============================

A `<NotFoundRoute>` is active when the beginning of its parent's path
matches the URL but none of its siblings do. It can be found at any level
of your hierarchy, allowing you to have a context-aware "not found" page.

Props
-----

See [`<Route props>`][routeProps]

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


A `NotFoundRoute` is active when the beginning of its parent's path
matches the URL but none of its siblings do. It can be found at any level
of your hierarchy, allowing you to have a context-aware "not found"
screens.

You'd want to use this to handle bad links and users typing invalid urls
into the address bar.

**Note**: This is not intended to be used for when a _resource_ is not
found. There is a difference between the router not finding a matched
path and a valid URL that results in a resource not being found.  The
url `courses/123` is a valid url and results in a matched route,
therefore it was "found" as far as routing is concerned. Then, if we
fetch some data and discover that the course `123` does not exist, we do
not want to transition to a new route. Just like on the server, you go
ahead and serve the url but render different UI (and use a different
status code). You shouldn't ever try to transition to a `NotFoundRoute`.

Props
-----

### `handler`

The `RouteHandler` component you want to be rendered when the route is
matched.

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


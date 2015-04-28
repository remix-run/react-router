A `Route` is used to declaratively map routes to your application's
screen hiearchy.

Props
-----

### `name` (optional)

The unique name of the route, used in the `Link` component and the
router's transition methods.

### `path` (optional)

The path used in the URL. If left undefined, the path will be defined by
the `name`, and if there is no name, will default to `/`.

Please refer to the [Path Matching Guide][path-matching] to learn more
about supported path matching syntax.

### `handler`

The `RouteHandler` component to be rendered when the route is active.

### `children`

Routes can be nested. When a child route path matches, the parent route
is also activated. Please refer to the [overview][overview] since this
is a very critical part of the router's design.

### `ignoreScrollBehavior`

When a route or its `params` change, the router adjusts window scroll
position according to the [`scrollBehavior`][scrollbehavior].  This is
generally desirable but you might want to opt-out of scrolling
adjustment for a specific route or a group of routes.

If you specify `ignoreScrollBehavior`, changes in `params` or any
transitions within its `children` will not adjust scroll position. This
can be useful on a search page or in a tabbed interface.

Note that changes in `query` never adjust scroll position, regardless of
the value of this attribute.

Example
-------

```xml
<!-- `path` defaults to '/' since no name or path provided -->
<Route handler={App}>
  <!-- path is automatically assigned to the name since it is omitted -->
  <Route name="about" handler={About}/>
  <Route name="users" handler={Users}>
    <!--
      note the dynamic segment in the path, and that it starts with `/`,
      which makes it "absolute", or rather, it doesn't inherit the path
      from the parent route
    -->
    <Route name="user" handler={User} path="/user/:id"/>
  </Route>
</Route>
```

  [overview]:#TODO
  [path-matching]:#TODO
  [ignoreScrollBehavior]:#TODO


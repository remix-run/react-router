API: `DefaultRoute` (component)
===============================

A `<DefaultRoute>` is active when the parent route's path matches exactly.

Note, this is not a `<NotFoundRoute>`. It is only active when the parent's
route path is matched exactly.

Props
-----

See [<Route props>][routeProps]

Example
-------

```xml
<Routes>
  <Route path="/" handler={App}>

    <!--
      When the url is `/`, this route will be active. In other
      words, `Home` will be the `<RouteHandler/>` in `App`.
    -->
    <DefaultRoute handler={Home}/>

    <Route name="about" handler={About}/>
    <Route name="users" handler={Users}>
      <Route name="user" handler={User} path="/user/:id"/>

      <!-- when the url is `/users`, this will be active -->
      <DefaultRoute name="users-index" handler={UsersIndex}/>

    </Route>
  </Route>
</Routes>
```

This is all really just a shortcut for the less intuitive version of the
same functionality:

```xml
<!-- don't do this -->

<!-- this route has a path but it'll never match directly because ... -->
<Route path="/users" handler={Users}>
  <!-- this child has the same path, and the child matches first -->
  <Route name="users-index" path="/users" handler={UsersIndex}/>
  <Route name="user" handler={User} path="/user/:id"/>
</Route>
```

  [routeProps]:/docs/api/components/Route.md#props

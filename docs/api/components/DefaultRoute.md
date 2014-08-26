API: `DefaultRoute` (component)
===============================

A route that is active when the parent route's path matches exactly. Or,
in other words, the default child route for a parent.

Note, this is not a `NotFoundRoute`. It is only active when the parent's
route path is matched exactly.

Props
-----

### `handler`

The component to be rendered when the route is active.

### `preserveScrollPosition`

If `true`, the router will not scroll the window up when the route is
transitioned to. Defaults to `false`. Ignored if the parent `<Routes/>`
has been set to `true`.

Example
-------

```xml
<Routes>
  <Route path="/" handler={App}>

    <!--
      when the url is `/`, this handler will be active, or in other
      words, will be `this.props.activeRouteHandler in the `App` handler
    -->
    <DefaultRoute handler={Home}/>

    <Route name="about" handler={About}/>
    <Route name="users" handler={Users}>
      <Route name="user" handler={User} path="/user/:id"/>

      <!-- when the url is `/users`, this will be active -->
      <DefaultRoute handler={UsersIndex}/>

    </Route>
  </Route>
</Routes>
```

This is all really just a shortcut for the less intuitive version of the
same functionality:

```xml
<!-- no path or name on what was previously the "users" route -->
<Route handler={Users}>
  <!-- the path moved down to the child -->
  <Route name="users-index" path="/users" handler={UsersIndex}/>
  <Route name="user" handler={User} path="/user/:id"/>
</Route>
```

`DefaultRoute` feels more natural, so you can name and transition to the
parent route.


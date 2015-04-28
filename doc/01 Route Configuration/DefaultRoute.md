A `DefaultRoute` will be the matched child route when the parent's path
matches exactly.

You'd want to use this to ensures a child `RouteHandler` is always
rendered when there is no child match. Think of it like `index.html` in
a directory of a static html server.

Props
-----

### `handler`

The `RouteHandler` component you want to be rendered when the route is
matched.

### `name` (optional)

The name of the route used when linking or transitioning to the route.

Example
-------

```xml
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
```


API: `Redirect` (component)
===========================

Configures a redirect for a path in your route declarations.

Props
-----

### `from`

The path you want to redirect from, including dynamic segments.

### `to`

The `name` of the route you want to redirect to.

Example
-------

```xml
<!--
  lets say we want to change from `/profile/123` to `/about/123`
  and redirect `/get-in-touch` to `/contact`
-->
<Routes>
  <Route handler={App}>
    <Route name="contact" handler={Contact}/>
    <Route name="about-user" path="about/:userId" handler={UserProfile}/>
  </Route>
  
  <Redirect from="get-in-touch" to="contact" />
  <Redirect from="profile/:userId" to="about-user" />
</Routes>
```

Note that the `<Redirect/>` can be placed anywhere in the route
hierarchy, if you'd prefer the redirects to be next to their respective
routes.

```xml
<Routes>
  <Route handler={App}>
    <Route name="contact" handler={Contact}/>
    <Redirect from="get-in-touch" to="contact" />
  </Route>
</Routes>
```

API: `Route` (component)
=========================

Configuration component to declare your application's routes and view hierarchy.

Props
-----

### `name`

The name of the route, used in the `Link` component and the router's
transition methods.

### `path`

The path used in the URL, supporting dynamic segments. If left
undefined, the path will be defined by the `name`, and if there is no
name, will default to `/`. This path is always absolute from the URL
"root", even if the leading slash is left off. Nested routes do not
inherit the path of their parent.

### `handler`

The component to be rendered when the route is active.

### `children`

Routes can be nested. When a child route matches, the parent route's
handler will have the child route's handler available as
`this.props.activeRouteHandler`. You can then render it in the parent
passing in any additional props as needed.

### `[prop]`

Any additional, user-defined, properties will be become properties of
the rendered handler.

#### Example:

```js
var App;
var foo = "hello";

var routes = (
  <Routes>
    // pass `foo` to `something`
    <Route handler={App} something={foo}/>
  </Routes>
);

App = React.createClass({
  render: function() {
    // access `something` on props
    return <div>{this.props.something}</div>
  }
});

React.renderComponent(routes, document.body);
document.body.innerHTML // -> <div>hello</div>
```

Example
-------

```xml
<Routes>
  <!-- path defaults to '/' since no name or path provided -->
  <Route handler={App}>
    <!-- path is automatically assigned to the name since it is omitted -->
    <Route name="about" handler={About}/>
    <Route name="users" handler={Users}>
      <!-- note the dynamic segment in the path -->
      <Route name="user" handler={User} path="/user/:id"/>
    </Route>
  </Route>
</Routes>
```


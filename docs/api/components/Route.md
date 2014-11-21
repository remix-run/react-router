API: `Route` (component)
=========================

Configuration component to declare your application's routes and view hierarchy.

Props
-----

### `name`

The name of the route, used in the `Link` component and the router's
transition methods.

### `path`

The path used in the URL. If left undefined, the path will be defined by
the `name`, and if there is no name, will default to `/`.

Please refer to the [Path Matching Guide][path-matching] to learn more
about supported path matching syntax.

### `handler`

The component to be rendered when the route is active.

### `addHandlerKey`

Defaults to `false`.

If you have dynamic segments in your URL, a transition from `/users/123`
to `/users/456` does not call `getInitialState`, `componentWillMount` or
`componentWillUnmount`. If you are using those lifecycle hooks to fetch
data and set state, you will also need to implement
`componentWillReceiveProps` on your handler, just like any other
component with changing props. This way, you can leverage the
performance of the React DOM diff algorithm. Look at the `Contact`
handler in the `master-detail` example.

If you'd rather be lazy, set this to `true` and the router will add a
key to your route, causing all new DOM to be built, and then the life
cycle hooks will all be called.

You will want this to be `true` if you're doing animations with React's
TransitionGroup component.

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
  render: function () {
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

  [path-matching]:/docs/guides/path-matching.md

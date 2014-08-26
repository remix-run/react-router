Upgrade Guide
=============

To see discussion around these API changes, please refer to the
[changelog](/CHANGELOG.md) and git log the commits to find the issues
they refer to.

0.5.x -> master
---------------

### Link params

Links should now pass their params in the `params` property, though the
old behavior will still work, you should update your code soon because
it will be removed by `v1.0`

```js
// 0.5.x
<Link to="user" userId="123"/>

// 0.6.x
<Link to="user" params={{userId: "123"}}/>
```

### Dynamic Segments, keys, and lifecycle methods

If you have dynamic segments and are depending on `getInitialState`,
`componentWillMount`, or `componentDidMount` to fire between transitions
to the same route--like `users/123` and `users/456`, then you have two
options: add `addHandlerKey={true}` to your route and keep the previous
behavior (but lose out on performance), or implement
`componentWillReceiveProps`.

```js
// 0.5.x
<Route handler={User} path="/user/:userId"/>

// 0.6.x
<Route handler={User} path="/user/:userId" addHandlerKey={true} />

// 0.5.x
var User = React.createClass({
  getInitialState: function() {
    return {
      user: getUser(this.props.params.userId);
    }
  }
});

// 0.6.x
var User = React.createClass({
  getInitialState: function() {
    return this.getState();{
  },

  componentWillReceiveProps: function(newProps) {
    this.setState(this.getState(newProps));
  },

  getState: function(props) {
    props = props || this.props;
    return {
      user: getUser(props.params.userId)
    };
  }
});
```

0.4.x -> 0.5.x
--------------

We brought back `<Routes/>`.

```js
// 0.4.x
var routes = (
  <Route handler={App} location="history">
    <Route name="about" handler="about"/>
  </Route>
);

// 0.5.x
var routes = (
  <Routes location="history">
    <Route handler={App}>
      <Route name="about" handler="about"/>
    </Route>
  </Routes>
);
```

0.3.x -> 0.4.x
--------------

NPM users should point their apps to `react-router` instead of
`react-nested-router`. Make sure to `npm prune`!

0.2.x -> 0.3.x
--------------

- React `0.11.x` is now required.
- `this.props.activeRoute` became `this.props.activeRouteHandler()`

```js
// 0.2.x

var App = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.activeRoute}
      </div>
    );
  }
});

// 0.3.x
var App = React.createClass({
  render: function() {
    // now you can send extra props to the active route handler
    // and use the new jsx syntax
    // <this.props.activeRouteHandler extraProp={something}/>
    return (
      <div>
        {this.props.activeRouteHandler()}
      </div>
    );
  }
});
```

0.1.x -> 0.2.x
--------------

The `Router` function was removed.

```js
// 0.1.x
var router = Router(routes);
router.renderComponent(element);

// 0.2.x
React.renderComponent(routes, element);
```


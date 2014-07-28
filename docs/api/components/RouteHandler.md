API: `RouteHandler` (component)
===============================

The component supplied to a route is called a "Route Handler". They are
rendered when their route is active. There are some special props and
static methods available to these components.

Props
-----

### `activeRouteHandler(extraProps)`

Render the active nested route handler with this property, passing in
additional properties as needed. This is the mechanism by which you get
effortless nested UI.

#### Example

```js
var App = React.createClass({
  render: function() {
    <div>
      <h1>Address Book</h1>
      {/* the active child route handler will be rendered here */}
      {/* you can "trickle down" props to the active child */}
      <this.props.activeRouteHandler someProp="foo" /> 
    </div>
  }
});

var Contact = React.createClass({
  render: function() {
    return <h1>{this.props.params.id}</h1>
  }
});

var routes = (
  <Routes>
    <Route handler={App}>
      <Route name="contact" path="/contact/:id" handler={Contact}>
    </Route>
  </Routes>
);

React.renderComponent(routes, document.body);
```

### `params`

When a route has dynamic segments like `<Route path="users/:userId"/>`,
the dynamic values from the url are available at
`this.props.params.userId`, etc.

### `query`

The query parameters from the url.

Static Lifecycle Methods
------------------------

You can define static methods on your route handlers that will be called
during route transitions.

### `willTransitionTo(transition, params)`

Called when a route is about to render, giving you the opportunity to
abort or redirect the transition. You can return a promise and the whole
route hierarchy will wait for the promises to resolve before proceeding.

See also: [transition](/docs/api/misc/transition.md)

### `willTransitionFrom(transition, component)`

Called when an active route is being transitioned out giving you an
opportunity to abort the transition. The `component` is the current
component, you'll probably need it to check its state to decide if you
want to allow the transition.

See also: [transition](/docs/api/misc/transition.md)

#### Example

```js
var Settings = React.createClass({
  statics: {
    willTransitionTo: function(transition, params) {
      return auth.isLoggedIn().then(function(loggedIn) {
        if (!loggedIn)
          return;
        transition.abort();
        return auth.logIn({transition: transition});
        // in auth module call `transition.retry()` after being logged in
      });
    },

    willTransitionFrom: function(transition, component) {
      if (component.formHasUnsavedData())) {
        if (!confirm('You have unsaved information, are you sure you want to leave this page?')) {
          transition.abort();
        }
      }
    }
  }

  //...
});
```


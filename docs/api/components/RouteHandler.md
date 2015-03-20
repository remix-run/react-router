API: `RouteHandler` (component)
===============================

A `<RouteHandler>` renders the handler of the route at the level of the
route hierarchy in which it is used.

Router Context
--------------

Router handlers are rendered with a router in their context with useful
methods.

Please see [`Router Context`](/docs/api/RouterContext.md)

Static Lifecycle Methods
------------------------

You can define some static methods on your route handlers that will be
called during route transitions.

### `willTransitionTo(transition, params, query, callback)`

Called when a handler is about to render, giving you the opportunity to
abort or redirect the transition. You can pause the transition while you
do some asynchonous work and call `callback(error)` when you're done, or
omit the callback in your argument list and it will be called for you.

See also: [Transition](/docs/api/Transition.md)

### `willTransitionFrom(transition, component, callback)`

Called when an active route is being transitioned out giving you an
opportunity to abort the transition. The `component` is the current
component, you'll probably need it to check its state to decide if you
want to allow the transition (like form fields).

See also: [Transition](/docs/api/Transition.md)

#### Example

```js
var Settings = React.createClass({
  statics: {
    willTransitionTo: function (transition, params) {
      if (!auth.isLoggedIn()) {
        transition.abort();
        auth.logIn({transition: transition});
        // in auth module call `transition.retry()` after being logged in
      }
    },

    willTransitionFrom: function (transition, component) {
      if (component.formHasUnsavedData()) {
        if (!confirm('You have unsaved information, are you sure you want to leave this page?')) {
          transition.abort();
        }
      }
    }
  }

  //...
});
```


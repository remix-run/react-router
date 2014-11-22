API: `RouteHandler` (component)
===============================

The component supplied to a route is called a "Route Handler". They can
be rendered by the parent handler with `<RouteHandler/>`.  There are
some special static methods available to these components.

Static Lifecycle Methods
------------------------

You can define static methods on your route handlers that will be called
during route transitions.

### `willTransitionTo(transition, params, query)`

Called when a handler is about to render, giving you the opportunity to
abort or redirect the transition. You can pause the transition while you
do some asynchonous work with `transition.wait(promise)`.

See also: [transition](/docs/api/misc/transition.md)

### `willTransitionFrom(transition, component)`

Called when an active route is being transitioned out giving you an
opportunity to abort the transition. The `component` is the current
component, you'll probably need it to check its state to decide if you
want to allow the transition (like form fields).

See also: [transition](/docs/api/misc/transition.md)

#### Example

```js
var Settings = React.createClass({
  statics: {
    willTransitionTo: function (transition, params) {
      return auth.isLoggedIn().then(function (loggedIn) {
        if (!loggedIn)
          return;
        transition.abort();
        auth.logIn({transition: transition});
        // in auth module call `transition.retry()` after being logged in
      });
    },

    willTransitionFrom: function (transition, component) {
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

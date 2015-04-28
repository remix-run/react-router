A user-defined component given to a `Route` as the `handler` prop. The
router will inject properties into your component when its rendered
by `RouteHandler`, it also calls some lifecycle static hooks during
transitions.

Injected Props
--------------

### `params`

The dynamic segments of the url.

### `query`

The query parameters of the url.

### `path`

The full application url path.

### Example

```js
// given a route like this:
<Route path="/course/:courseId/students" handler={Students}/>

// and a url like this:
"/course/123/students?sort=name"

var Students = React.createClass({
  render () {
    this.props.params.courseId; // "123"
    this.props.query.sort; // "name"
    this.props.path; // "/course/123/students?sort=name"
    // ...
  }
});
```

Static Lifecycle Methods
------------------------

You can define some static methods on your route handlers that will be
called during route transitions.

### `willTransitionTo(transition, params, query, callback)`

Called when a handler is about to render, giving you the opportunity to
abort or redirect the transition. You can pause the transition while you
do some asynchonous work and call `callback(error)` when you're done, or
omit the callback in your argument list and it will be called for you.

See also: [Transition][transition]

### `willTransitionFrom(transition, component, callback)`

Called when an active route is being transitioned out giving you an
opportunity to abort the transition. The `component` is the current
component, you'll probably need it to check its state to decide if you
want to allow the transition (like form fields).

See also: [Transition][transition]

### Note about `callback` argument

If you add `callback` to your arguments list, you must call it
eventually, even if you redirect the transition.

### Example

```js
var Settings = React.createClass({
  statics: {
    willTransitionTo: function (transition, params, query, callback) {
      auth.isLoggedIn((isLoggedIn) => {
        transition.abort();
        callback();
      });
    },

    willTransitionFrom: function (transition, component) {
      if (component.formHasUnsavedData()) {
        if (!confirm('You have unsaved information,'+
                     'are you sure you want to leave this page?')) {
          transition.abort();
        }
      }
    }
  }

  //...
});
```

[transition]:#TODO

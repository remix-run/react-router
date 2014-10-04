API: `PathState` (mixin)
==========================

A mixin for components that need to know the current URL path.
Components that use it get two things:

1. An optional `location` prop that they use to track changes to the URL
2. An `updatePath` method that is called when the current URL path
   changes

Props
-----

### `location`

Contains the location type `hash`, `history`, etc.

Lifecycle Methods
-----------------

### `updatePath(path, actionType)`

Called when the url changes.

Example
-------

```js
var App = React.createClass({
  mixins: [PathState],

  updatePath: function (path) {
    ga('send', 'pageview', path);
  }
});
```


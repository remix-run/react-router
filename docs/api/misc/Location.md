API: `Location` (object)
==========================

You can supply the router with your own location implementation. The
following methods must be implemented:

Methods
-------

### `addChangeListener(listener)`

Adds a function to the location that should be called when it changes.

### `push`

Called when the router is transitioning from one path to another.

### `replace`

Called when ther router is replacing (not transitioning) one url with
another.

### `pop`

Called when the router attempts to go back one entry in the history.

### `getCurrentPath`

Should return the current URL path, complete with query string (if applicable).
This method should be ready to go immediately after setup.

### `toString`

Should return a useful string for logging and debugging.

Example
-------

For examples of how to implement your own location, please see the locations
included in this repository.


```js
var MyLocation = {
  addChangeListener: function (listener) {},
  push: function (path) {},
  replace: function (path) {},
  pop: function () {},
  getCurrentPath: function () {}
};

Router.run(routes, MyLocation, callback);
```

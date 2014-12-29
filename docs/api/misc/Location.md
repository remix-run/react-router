API: `Location` (object)
==========================

You can supply the router with your own location implementation. The
following methods must be implemented:

Methods
-------

### `addChangeListener(listener)`

Adds a function to the location that should be called when it changes.

### `removeChangeListener(listener)`

Stop calling the given function when the location changes.

### `push`

Called when the router is transitioning from one path to another.

### `replace`

Called when the router is replacing (not transitioning) one url with
another.

### `pop`

Called when the router attempts to go back one entry in the history.

### `getCurrentPath`

Should return the current URL path, complete with query string (if applicable).
This method should be ready to go immediately after setup.

### `toString`

Should return a useful string for logging and debugging.

History
-------

Additionally, location objects must:

- Increment `ReactRouter.History.length` immediately **after** the URL changes
- Decrement `ReactRouter.History.length` immediately **before** going back to the
  previous URL

Please refer to the [built-in location objects][locations] to get an idea for how this is done.

[locations]: /modules/locations

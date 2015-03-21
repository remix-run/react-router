API: `Location` (object)
========================

The router uses "location" objects to determine the current state of
the application and update it when needed. In a browser environment,
the location represents the URL in the browser's location bar. On the
server, the location is the URL path that was used in the request.

ReactRouter ships with several locations that make it convenient to
use in many different scenarios. They are listed below.

Location            | Description
------------------- | -----------
`HashLocation`      | Stores the current URL in `window.location.hash`. Use this if you need to support browsers that don't support the HTML5 history API
`HistoryLocation`   | Uses the HTML5 history API to store state in clean URLs
`RefreshLocation`   | A fallback that uses clean URLs in browsers that do not support the HTML5 history API by updating `window.location` whenever the route changes. The router automatically falls back to this when you try to use `HistoryLocation` in old browsers
`StaticLocation`    | A location for stateless environments (like servers) where the URL is given once
`TestLocation`      | A location that allows you to easily stub out URL history when writing tests

You can also supply the router with your own location implementation. The
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

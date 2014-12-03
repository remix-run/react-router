API: `Router.run`
=================

The main API into react router. It runs your routes, matching them
against a location, and then calls back with the next state for you to
render.

Signature
---------

`Router.run(routes, [location,] callback)`

Arguments
---------

### `routes`

Your route config. See [Route][1]

### `location` optional

Defaults to `Router.HashLocation`. If given a `Location` object, it
will setup and listen for changes on it, if given a string path, the
router will immediately match that path and callback.

#### Examples

```js
// Defaults to `Router.HashLocation`
// callback is called whenever the hash changes
Router.run(routes, callback);

// HTML5 History
// callback is called when history events happen
Router.run(routes, Router.HistoryLocation, callback);

// Server rendering
// callback is called once, immediately.
Router.run(routes, '/some/path', callback);
```

### `callback(Handler, state)`

The callback receives two arguments:

1. `Handler`
2. `state`

#### `Handler`

A ReactComponent class with the current match all wrapped up inside it, ready
for you to render.

#### `state`

An object containing the matched state.

#### `state.path`

The current URL path with query string.

#### `state.action`

The action that lead to the route change.

#### `state.pathname`

The current URL path without the query string.

#### `state.params`

The active params in the location match.

#### `state.query`

The active query in the location match.

#### `state.routes`

An array of the matched [routes][1]. Very useful for fetching data before
rendering.

See also: [Route][1].

Examples
--------

Basic Usage:

```js
Router.run(routes, function (Handler) {
  // whenever the url changes, this callback is called again
  React.render(<Handler/>, document.body);
});
```

Sample data fetching using `state.routes`. Check out the
[async-data][2] example.

```js
var resolveHash = require('when/keys').all;

var SampleHandler = React.createClass({
  statics: {
    // this is going to be called in the `run` callback
    fetchData: function (params) {
      return fetchStuff(params);
    }
  },
  // ...
});

Router.run(routes, Router.HistoryLocation, function (Handler, state) {
  
  // create the promises hash
  var promises = state.routes.filter(function (route) {
    // gather up the handlers that have a static `fetchData` method
    return route.handler.fetchData;
  }).reduce(function (promises, route) {
    // reduce to a hash of `key:promise`
    promises[route.name] = route.handler.fetchData(state.params);
    return promises;
  }, {});

  resolveHash(promises).then(function (data) {
    // wait until we have data to render, the old screen stays up until
    // we render
    React.render(<Handler data={data}/>, document.body);
  });
});
```

Server Rendering

```js
something.serve(function (req, res) {
  Router.run(routes, req.path, function (Handler, state) {
    // could fetch data like in the previous example
    fetchData(state.matches).then(function (data) {
      var html = React.renderToString(<Handler data={data} />);
      req.send(html);
    });
  });
});
```

  [1]:./components/Route.md
  [2]:https://github.com/rackt/react-router/tree/master/examples/async-data


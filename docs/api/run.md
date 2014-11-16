API: `Router.run(routes, [location,] callback)`
=================

The main API into react router. It runs your routes, matching them
against a location, and then calls back with the next state for you to
render.

Arguments
---------

### `routes`

Your route config. See [Route][1]

### `location` optional

Defaults to [`Router.HashLocation`][2]. If given a `Location` object, it
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

A react element with the current match all wrapped up inside it, ready
for you to render.

#### `state`

An object containing the matched state.

##### `state.matches`

An array of the matched [routes][3]. Very useful for fetching data before
rendering.

See also: [Route][3].

##### `state.activeParams`

The active params in the location match.

##### `state.activeQuery`

The active query in the location match.

#### `state.path`

The path matched.

Examples
--------

Basic Usage:

```js
Router.run(routes, function (Handler) {
  // whenever the url changes, this callback is called again
  React.render(<Handler/>, document.body);
});
```

Sample data fetching using `state.matches`. Check out the
[async-data][4] example.

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
  var promises = state.matches.filter(function (match) {
    // gather up the handlers that have a static `fetchData` method
    return match.route.handler.fetchData;
  }).reduce(function (promises, match) {
    // reduce to a hash of `key:promise`
    promises[match.route.name] = match.route.handler.fetchData(state.activeParams)
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
  [2]:./locations/HashLocation.md
  [3]:./classes/Route.md
  [4]:https://github.com/rackt/react-router/tree/latest/examples/async-data


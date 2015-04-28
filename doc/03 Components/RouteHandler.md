Component that renders the active child route handler of a parent route
handler component. Any time you have nested routes you need to render a
`RouteHandler` to get the UI to nest.

We recognize its a bit confusing at first the difference between
`RouteHandler` and a "Route Handler" supplied to `Route`. You define a
"Route Handler" and you render it with `RouteHandler` inside your route
hierarchy. A better name would be `ActiveChildRouteHandler` but we're
guessing you don't want to type that.

Example
-------

```js
// given these routes
var routes = (
  <Route handler={App}>
    <Route name="about" handler={About}/>
    <Route name="home" handler={Home}/>
  </Route>
);

// `RouteHandler` will render either `About` or `Home`, depending on
// which one is matched in the url
var App = React.createClass({
  render () {
    return (
      <div>
        <h1>App</h1>
        <RouteHandler/>
      </div>
    );
  }
});
```


Server Rendering
================

Server rendering of your app with react router is no different than
anything else, really, you just pass in the requested path to
`Router.run` and then use `React.renderToString` instead of
`React.render`.

```js
var App = React.createClass({
  render: function () {
    return <div>Hi</div>;
  }
});

var routes = (
  <Route handler={App} path="/" />
);

// if using express it might look like this
app.use(function (req, res) {
  // pass in `req.url` and the router will immediately match
  Router.run(routes, req.url, function (Handler) {
    var content = React.renderToString(<Handler/>);
    res.render('main', {content: content});
  });
});
```

We'll add some more here soon, but for the adventurous few, this ought
to get you started.


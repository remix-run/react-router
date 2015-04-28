A component created by React Router to be rendered at the top-level of
your application.

Example
-------

```js
Router.run(routes, (Root) => {
  React.render(<Root/>, document.body);
});
```

Notes
-----

Currently the router instance is the very same object as `Root`.

```js
var MyRouter = Router.create({ routes });

MyRouter.run((Root) => {
  Root === MyRouter; // true
});
```

Currently this is simply an implementation detail, but we may eventually
embrace this as public API.


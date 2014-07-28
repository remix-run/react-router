API: `Routes` (component)
=========================

Configuration component for your router, all `<Route/>`s must be
children of a `<Routes/>`. It is the component you provide to
`React.renderComponent(routes, el)`.

Props
-----

### `location`

One of `"hash"` or `"history"`, defaults to `"hash"`.

Configures what type of url you want. `"hash"` includes `#/` in the url and
works without a server, if you use `history` your server will need to
support it.

For browsers that don't support the HTML5 history API the router will
fall back to `window.location` if you choose `history`. This way all
users get the same urls and can share them.

Example
-------

```jsx
var routes = (
  <Routes location="history">
    <Route handler={App}/>
  </Routes>
);
React.renderComponent(routes, document.body);
```


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
fall back to `window.location` if you choose `history`, in other words,
the router will simply cause a full page reload. This way all users get
the same urls and can share them.

### `preserveScrollPosition`

If `true`, the router will not scroll the window up globally when any
route is transitioned to. Defaults to `false`. When `false`, the
`<Route/>` gets to decide whether or not to scroll on transition.

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


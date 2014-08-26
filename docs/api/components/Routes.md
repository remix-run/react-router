API: `Routes` (component)
=========================

Configuration component for your router, all `<Route/>`s must be
children of a `<Routes/>`. It is the component you provide to
`React.renderComponent(routes, el)`.

Props
-----

### `location`

One of `"hash"`, `"history"` or a user defined location implementation,
defaults to `"hash"`.

`"hash"` includes `#/` in the url and works without a server, if you use
`history` your server will need to support it.

For browsers that don't support the HTML5 history API the router will
fall back to `window.location` if you choose `history`, in other words,
the router will simply cause a full page reload. This way all users get
the same urls and can share them.

See also: [user supplied locations][Location].

### `preserveScrollPosition`

If `true`, the router will not scroll the window up globally when any
route is transitioned to. Defaults to `false`. When `false`, the
`<Route/>` gets to decide whether or not to scroll on transition.

### `onAbortedTransition`

A function called when any transition is aborted.

### `onActiveStateChange`

A function called when the active routes change.

#### signature

`function(nextState)`

### `onTransitionError`

A function called when a transition has an error.

#### signature

`function(error)`

Example
-------

```jsx
function onError(error) {
  handleError(error);
}

var routes = (
  <Routes location="history" onTransitionError={onError}>
    <Route handler={App}/>
  </Routes>
);
React.renderComponent(routes, document.body);
```

  [Location]:../misc/Location.md


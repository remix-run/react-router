API: `Routes` (component)
=========================

Configuration component for your router, all `<Route/>`s must be
children of a `<Routes/>`. It is the component you provide to
`React.renderComponent(routes, el)`.

Props
-----

### `location`

One of `"hash"`, `"history"`, `'none'`, or a user defined location
implementation, defaults to `"hash"`.

`"hash"` includes `#/` in the url and works without a server, if you use
`history` your server will need to support it.

For browsers that don't support the HTML5 history API the router will
fall back to `window.location` if you choose `history`, in other words,
the router will simply cause a full page reload. This way all users get
the same urls and can share them.

See also: [user supplied locations][Location].

### `scrollBehavior`

Determines the scrolling behavior after route transitions.

One of:

- `'imitateBrowser'` - default, imitates what browsers do in a typical
  page reload scenario: preserves scroll positions when using the back
  button, scrolls up when you come to a new route by clicking a link,
  etc.

- `'scrollToTop'` - scrolls the window up all the time.

- `'none'` - doesn't do anything (you should probably do something about
  that).

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


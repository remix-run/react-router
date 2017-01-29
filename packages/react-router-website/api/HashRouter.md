# &lt;HashRouter>

A [&lt;Router>](#router) that uses the hash portion of the URL (i.e. `window.location.hash`) to keep your UI in sync with the URL.

**IMPORTANT NOTE:** Hash history does not support `location.key` or `location.state`. In previous versions we attempted to shim the behavior but there were edge-cases we couldn't solve. Any code or plugin that needs this behavior won't work. As this technique is only intended to support legacy browsers, we encourage you to configure your server to work with `<BrowserHistory>` instead.

```js
<HashRouter>
  <App/>
</HashRouter>
```

## basename: string _`<HashRouter>`_

The base URL for all locations.

```js
<HashRouter basename="/calendar"/>
<Link to="/today"/> // renders <a href="#/calendar/today">
```

## getUserConfirmation: func _`<HashRouter>`_

A function to use to confirm navigation. Defaults to using [`window.confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm).

```js
// this is the default behavior
const getConfirmation = (message, callback) => {
  const allowTransition = window.confirm(message)
  callback(allowTransition)
}

<HashRouter getUserConfirmation={getConfirmation}/>
```

## hashType: string _`<HashRouter>`_

The type of encoding to use for `window.location.hash`. Available values are:

- `"slash"` - Creates hashes like `#/` and `#/sunshine/lollipops`
- `"noslash"` - Creates hashes like `#` and `#sunshine/lollipops`
- `"hashbang"` - Creates ["ajax crawlable"](https://developers.google.com/webmasters/ajax-crawling/docs/learn-more) (deprecated by Google) hashes like `#!/` and `#!/sunshine/lollipops`

Defaults to `"slash"`.

## children: node _`<HashRouter>`_

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.

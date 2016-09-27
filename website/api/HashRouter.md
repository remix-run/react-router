# `<HashRouter>`

A router that uses the hash portion of the URL (i.e. `window.location.hash`) to keep your UI in sync with the URL.

**IMPORTANT NOTE** Hash history does not support `location.key` or `location.state`. In previous versions we attempted to shim the behavior but there were edge-cases we couldn't solve. Any code or plugin that needs this behavior won't work. As this technique is only intended to support legacy browsers, we encourage you to configure your server to work with `<BrowserHistory>` instead.

```js
<HashRouter>
  <App/>
</HashRouter>
```

## `basename`

The base URL for all locations.

```js
<HashRouter basename="/calendar" />

// now links like this:
<Link to="/today"/>
// will generate links with an href to "#/calendar/today"
```

## `getUserConfirmation`

A function to use to confirm navigation. TODO: Provide an example here.

## `hashType`

- `"slash"`: default - Creates URLs like `#/` and `#/foo/bar`
- `"noslash"` - Creates URLs like `#` and `#foo/bar`
- `"hashbang"` - Creates extra ugly URLs like `#!/` and `#!/foo/bar`

# `</HashRouter>`

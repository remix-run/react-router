# `<HashRouter>`

Keeps your UI in sync with the super hacky hash portion of the url. We
encourage you to configure your server to work with `BrowserHistory`
instead.

**IMPORTANT NOTE** Hash history does not support `location.key` or
`location.state`. In previous versions we attempted to shim the behavior
but there were edge-cases we couldn't solve. Any code or plugin that
needs this behavior won't work.

```js
<HashRouter>
  <App/>
</HashRouter>
```

## `basename`

The base URL for all locations. If your app is served from a
sub-directory on your server, you'll want to set this to the
sub-directory.

```js
<HashRouter basename="/calendar" />

// now links like this:
<Link to="/today"/>
// will generate links with an href to "#/calendar/today"
```

## `hashType`

- `"slash"`: default - Creates urls like `#/` and `#/foo/bar`
- `"noslash"` - Creates urls like `#` and `#foo/bar`
- `"hashbang"` - Creates extra ugly urls like `#!/` and `#!/foo/bar`

# `</HashRouter>`

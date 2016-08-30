# `<BrowserRouter>`

Keeps your UI in sync with the browser history.

```js
<BrowserRouter>
  <App/>
</BrowserRouter>
```

## `basename`

The base URL for all locations. If your app is served from a
sub-directory on your server, you'll want to set this to the
sub-directory.

```js
<BrowserRouter basename="/calendar" />

// now links like this:
<Link to="/today"/>
// will generate links with an href to "/calendar/today"
```


# `</BrowserRouter>`

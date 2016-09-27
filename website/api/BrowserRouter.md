# `<BrowserRouter>`

A router that uses the HTML5 history API (`pushState`, `replaceState` and the `popstate` event) to keep your UI in sync with the URL.

```js
<BrowserRouter>
  <App/>
</BrowserRouter>
```

## `basename`

The base URL for all locations. If your app is served from a sub-directory on your server, you'll want to set this to the sub-directory.

```js
<BrowserRouter basename="/calendar" />

// now links like this:
<Link to="/today"/>
// will generate links with an href to "/calendar/today"
```

## `forceRefresh`

Pass `true` to force the router to use full page refreshes on page navigation.

## `getUserConfirmation`

A function to use to confirm navigation. TODO: Provide an example here.

## `keyLength`

The length to use keys that are generated for `location.key`. Defaults to 6.

# `</BrowserRouter>`

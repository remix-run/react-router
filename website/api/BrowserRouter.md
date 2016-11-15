# BrowserRouter

A router that uses the HTML5 history API (`pushState`, `replaceState` and the `popstate` event) to keep your UI in sync with the URL.

```js
<BrowserRouter
  basename={optionalString}
  forceRefresh={optionalBool}
  getUserConfirmation={optionalFunc}
  keyLength={optionalNumber}
/>
  <App/>
</BrowserRouter>
```

## basename: optionalString _BrowserRouter_

The base URL for all locations. If your app is served from a sub-directory on your server, you'll want to set this to the sub-directory.

```js
<BrowserRouter basename="/calendar" />

// now links like this:
<Link to="/today"/>
// will generate links with an href to "/calendar/today"
```

## forceRefresh: optionalFunc _BrowserRouter_

If `true` the router will use full page refreshes on page navigation.  You probably only want this in browsers that your app supports that don't support HTML history.

```js
const supportsHistory = 'pushState' in window.history
<BrowserRouter forceRefresh={!supportsHistory}/>
```

## getUserConfirmation: optionalFunc _BrowserRouter_

A function to use to confirm navigation, defaults to `window.prompt`

```js
// this is the default behavior
const getConfirmation = (message, callback) => {
  const allowTransition = window.confirm(message)
  callback(allowTransition)
}

<BrowserRouter getUserConfirmation={getConfirmation} />
```

## keyLength: optionalNumber _BrowserRouter_

The length to use keys that are generated for `location.key`. Defaults to 6.

```js
<BrowserRouter keyLength={12} />
```

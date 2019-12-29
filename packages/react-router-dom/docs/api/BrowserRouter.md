# &lt;BrowserRouter>

A [`<Router>`](../../../react-router/docs/api/Router.md) that uses the HTML5 history API (`pushState`, `replaceState` and the `popstate` event) to keep your UI in sync with the URL.

```jsx
<BrowserRouter
  basename={optionalString}
  forceRefresh={optionalBool}
  getUserConfirmation={optionalFunc}
  keyLength={optionalNumber}
>
  <App />
</BrowserRouter>
```

## basename: string

The base URL for all locations. If your app is served from a sub-directory on your server, you'll want to set this to the sub-directory. A properly formatted basename should have a leading slash, but no trailing slash.

```jsx
<BrowserRouter basename="/calendar" />
<Link to="/today"/> // renders <a href="/calendar/today">
```

## getUserConfirmation: func

A function to use to confirm navigation. Defaults to using [`window.confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm).

```jsx
<BrowserRouter
  getUserConfirmation={(message, callback) => {
    // this is the default behavior
    const allowTransition = window.confirm(message);
    callback(allowTransition);
  }}
/>
```

## forceRefresh: bool

If `true` the router will use full page refreshes on page navigation. You may want to use this to imitate the way a traditional server-rendered app would work with full page refreshes between page navigation.

```jsx
<BrowserRouter forceRefresh={true} />
```

## keyLength: number

The length of `location.key`. Defaults to 6.

```jsx
<BrowserRouter keyLength={12} />
```

## children: node

The child elements to render.

Note: On React &lt; 16 you must use a [single child element](https://facebook.github.io/react/docs/react-api.html#reactchildrenonly) since a render method cannot return more than one element. If you need more than one element, you might try wrapping them in an extra `<div>`.

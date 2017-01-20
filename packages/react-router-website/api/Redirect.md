# Redirect

Rendering a `<Redirect>` will navigate to a new location.

The new location will override the current location in the browser's history, like server-side redirects (HTTP 3xx) do.

```js
<Route exact path="/" render={() => (
  loggedIn ? (
    <Redirect to="/dashboard"/>
  ) : (
    <PublicHomePage/>
  )
)}/>
```

## to: string _Redirect_

The URL to redirect to.

```js
<Redirect to="/somewhere/else"/>
```

## to: object _Redirect_

A location to redirect to.

```js
<Redirect to={{
  pathname: '/login',
  search: '?utm=your+face',
  state: { referrer: currentLocation }
}}/>
```

## push: bool _Redirect_

When true, redirecting will add a new history state with `pushState` instead of replacing the current history state with `replaceState`.

```js
<Redirect to="/somewhere/else" push/>
```

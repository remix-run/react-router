# &lt;Redirect>

Rendering a `<Redirect>` will navigate to a new location.

The new location will override the current location in the history stack, like server-side redirects (HTTP 3xx) do.

```js
<Route exact path="/" render={() => (
  loggedIn ? (
    <Redirect to="/dashboard"/>
  ) : (
    <PublicHomePage/>
  )
)}/>
```

## to: string _`<Redirect>`_

The URL to redirect to.

```js
<Redirect to="/somewhere/else"/>
```

## to: object _`<Redirect>`_

A location to redirect to.

```js
<Redirect to={{
  pathname: '/login',
  search: '?utm=your+face',
  state: { referrer: currentLocation }
}}/>
```

## push: bool _`<Redirect>`_

When true, redirecting will push a new entry onto the history instead of replacing the current one.

```js
<Redirect push to="/somewhere/else"/>
```

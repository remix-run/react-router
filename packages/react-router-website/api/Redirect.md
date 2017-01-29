# &lt;Redirect> {id=redirect}

Rendering a `<Redirect>` will navigate to a new location.

The new location will override the current location in the history stack, like server-side redirects (HTTP 3xx) do.

```js
import { Route, Redirect } from 'react-router'

<Route exact path="/" render={() => (
  loggedIn ? (
    <Redirect to="/dashboard"/>
  ) : (
    <PublicHomePage/>
  )
)}/>
```

## to: string _`<Redirect>`_ {id=redirect.to-string}

The URL to redirect to.

```js
<Redirect to="/somewhere/else"/>
```

## to: object _`<Redirect>`_ {id=redirect.to-object}

A location to redirect to.

```js
<Redirect to={{
  pathname: '/login',
  search: '?utm=your+face',
  state: { referrer: currentLocation }
}}/>
```

## push: bool _`<Redirect>`_ {id=redirect.push}

When `true`, redirecting will push a new entry onto the history instead of replacing the current one.

```js
<Redirect push to="/somewhere/else"/>
```

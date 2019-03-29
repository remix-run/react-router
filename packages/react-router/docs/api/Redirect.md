# &lt;Redirect>

Rendering a `<Redirect>` will navigate to a new location. The new location will override the current location in the history stack, like server-side redirects (HTTP 3xx) do.

```jsx
import { Route, Redirect } from 'react-router'

<Route exact path="/" render={() => (
  loggedIn ? (
    <Redirect to="/dashboard"/>
  ) : (
    <PublicHomePage/>
  )
)}/>
```

## to: string

The URL to redirect to. Any valid URL path that [`path-to-regexp@^1.7.0`](https://github.com/pillarjs/path-to-regexp/tree/v1.7.0) understands.
All URL parameters that are used in `to` must be covered by `from`.

```jsx
<Redirect to="/somewhere/else" />
```

## to: object

A location to redirect to. `pathname` can be any valid URL path that [`path-to-regexp@^1.7.0`](https://github.com/pillarjs/path-to-regexp/tree/v1.7.0) understands.

```jsx
<Redirect
  to={{
    pathname: "/login",
    search: "?utm=your+face",
    state: { referrer: currentLocation }
  }}
/>
```

The `state` object can be accessed via `this.props.location.state` in the redirected-to component. This new `referrer` key (which is not a special name) would then be accessed via `this.props.location.state.referrer` in the `Login` component pointed to by the pathname `'/login'`

## push: bool

When `true`, redirecting will push a new entry onto the history instead of replacing the current one.

```jsx
<Redirect push to="/somewhere/else" />
```

## from: string

A pathname to redirect from. Any valid URL path that [`path-to-regexp@^1.7.0`](https://github.com/pillarjs/path-to-regexp/tree/v1.7.0) understands.
All matched URL parameters are provided to the pattern in `to`. Must contain all parameters that are used in `to`. Additional parameters not used by `to` are ignored.

This can only be used to match a location when rendering a `<Redirect>` inside of a `<Switch>`. See [`<Switch children>`](./Switch.md#children-node) for more details.

```jsx
<Switch>
  <Redirect from='/old-path' to='/new-path'/>
  <Route path='/new-path' component={Place}/>
</Switch>

// Redirect with matched parameters
<Switch>
  <Redirect from='/users/:id' to='/users/profile/:id'/>
  <Route path='/users/profile/:id' component={Profile}/>
</Switch>
```

## exact: bool

Match `from` exactly; equivalent to [Route.exact](./Route.md#exact-bool).

## strict: bool

Match `from` strictly; equivalent to [Route.strict](./Route.md#strict-bool).

## sensitive: bool

Match `from` case sensitive; equivalent to [Route.sensitive](./Route.md#sensitive-bool).

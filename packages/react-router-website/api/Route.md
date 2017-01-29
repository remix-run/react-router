# &lt;Route>

Renders some UI when a URL matches a location.

```js
import { BrowserRouter, Route } from 'react-router-dom'

<BrowserRouter>
  <div>
    <Route exact path="/" component={Home}/>
    <Route path="/news" component={NewsFeed}/>
  </div>
</BrowserRouter>
```

## path: string _`<Route>`_

Any valid URL path that [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) understands.

```js
<Route path="/users/:id" component={User}/>
```

Routes without a `path` _always_ match.

## exact: bool _`<Route>`_

When `true`, will only match if the path matches the `location.pathname` _exactly_.

| path | location.pathname | exact | matches? |
|---|---|---|---|---|
| `/one`  | `/one/two`  | `true` | no |
| `/one`  | `/one/two`  | `false` | yes |

```js
<Route exact path="/one" component={About}/>
```

## strict: bool _`<Route>`_

When `true`, enforces strict matching of trailing slashes on `location.pathname`.

| path | location.pathname | strict | matches? |
|---|---|---|---|---|
| `/one/two`  | `/one/two/`  | `false` | yes |
| `/one/two`  | `/one/two/`  | `true` | no |
| `/one/two/`  | `/one/two/`  | `false` | yes |
| `/one/two/`  | `/one/two/`  | `true` | yes |

```js
<Route strict path="/one/two/" component={About}/>
```

## component: func _`<Route>`_

A React component to render when the location matches.

The component receives the following props from the [`history`](https://github.com/mjackson/history) object:

- `length` - (number) The number of entries in the history stack
- `action` - (string) The current action (`PUSH`, `REPLACE`, or `POP`)
- `location` - (object) The current location. May have the following properties:
  - `pathname` - (string) The path of the URL
  - `search` - (string) The URL query string
  - `hash` - (string) The URL hash fragment
  - `state` - (string) location-specific state that was provided to `push(path, state)` when this location was pushed onto the stack. Only available in browser and memory history.

Additionally, the component also receives these props from the `history` object for navigation:

- `push(path, [state])` - (function) Pushes a new entry onto the history stack
- `replace(path, [state])` - (function) Replaces the current entry on the history stack
- `go(n)` - (function) Moves the pointer in the history stack by `n` entries
- `goBack()` - (function) Equivalent to `go(-1)`
- `goForward()` - (function) Equivalent to `go(1)`
- `block(prompt)` - (function) Prevents navigation (see [the history docs](https://github.com/mjackson/history#blocking-transitions))

Additional props may also be received depending on the history implementation you're using. Please refer to [the history documentation](https://github.com/mjackson/history#properties) for more details.

If the route matched, the component also receives:

- `match` - (object) Information about the match. May have the following properties:
  - `params` - (object) The values parsed from the pathname corresponding by name to the dynamic segments of the path
  - `isExact` - (bool) Whether or not the match is exact (v. partial)
  - `path` - (string) The path pattern used to match. Useful for building nested `<Route>`s
  - `url` - (string) The matched portion of the URL. Useful for building nested `<Link>`s

```js
<Route path="/user/:id" component={User}/>
```

```js
import React, { PropTypes } from 'react'

class User extends React.Component {
  static propTypes = {
    length: PropTypes.number,
    action: PropTypes.string,
    location: PropTypes.shape({
      pathname: PropTypes.string,
      search: PropTypes.string,
      hash: PropTypes.string,
      state: PropTypes.object
    }),
    match: PropTypes.shape({
      params: PropTypes.object,
      isExact: PropTypes.bool,
      path: PropTypes.string,
      url: PropTypes.string,
    })
  }

  render() {
    const { id } = this.props.match.params
    return <pre>{JSON.stringify(this.props, null, 2)}</pre>
  }
}
```

## render: func _`<Route>`_

Instead of having a `component` rendered for you, you can pass in a function to be called when the location matches. This function will be called with the same props that are passed to the `component`.

This allows for convenient inline match rendering and wrapping.

```js
// convenient inline rendering
<Route path="/home" render={() => <div>Home</div>}/>

// wrapping/composing
const FadingRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={matchProps => (
    <FadeIn>
      <Component {...matchProps}/>
    </FadeIn>
  )}/>
)

<FadingRoute path="/cool" component={Something}/>
```

**NOTE:** `<Route component>` takes precendence over `<Route render>` so don't use both in the same `<Route>`.

## children: func _`<Route>`_

Sometimes you need to render whether the path matches the location or not. In these cases, you can use the function `children` prop. It works exactly like `render` except that it gets called whether there is a match or not.

The children prop will be called with an object that contains a `match` and a `history` property. `match` will be null if there was no match. This will allow you to dynamically adjust your UI based on if the route matches or not.

Here we're adding an `active` class if the route matches

```js
<ul>
  <ListItemLink to="/somewhere"/>
  <ListItemLink to="/somewhere-else"/>
</ul>

const ListItemLink = ({ to, ...rest }) => (
  <Route path={to} children={({ match }) => (
    <li className={match ? 'active' : ''}>
      <Link to={to} {...rest}/>
    </li>
  )}/>
)
```

This could also be useful for animations:

```js
<Route children={({ match, ...rest}) => (
  {/* Animate will always render, so you can use lifecycles
      to animate its child in and out */}
  <Animate>
    {match && <Something {...rest}/>}
  </Animate>
)}/>
```

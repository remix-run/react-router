# Route

Renders UI when a URL path matches a location.

## path: string _Route_

Any valid URL path that [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) understands.

```js
<Route path="/users/:id" component={User}/>
```

Routes without a `path` _always_ match.

## exact: bool _Route_

When `true`, will only match if the path matches the `location.pathname` _exactly_.

| path | location.pathname | exact | matches? |
|---|---|---|---|---|
| `/foo`  | `/foo/bar`  | `true` | no |
| `/foo`  | `/foo/bar`  | `false` | yes |

```js
<Route exact path="/foo" component={Foo}/>
```

## component: func _Route_

A React component to render when the location matches.

The component will be rendered with two props: `history` and `match`.

`match` is a object with the following properties
- `isExact`: (bool) Whether or not the match is exact (v. partial)
- `params`: (object) The values parsed from the pathname corresponding by name to the dynamic segments of the path
- `path`: (string) The path pattern used to match
- `url`: (string) The matched portion of the URL

`history` is generated from the [history](https://github.com/mjackson/history) library and has the following properties and methods
- `action`: (string) The current action (`PUSH`, `REPLACE`, or `POP`)
- `length`: (number) The number of entries in the history stack
- `location`: (object) Represents the current location and has the following properties
  - `pathname`: (string) The path of the URL
  - `search`: (string) The URL query string
  - `hash`: (string) The URL hash fragment
- `block`: (function)
- `go`: (function)
- `goBack`: (function)
- `listen`: (function)
- `push`: (function)
- `replace`: (function)

*For more detailed documentation on `history`, refer to the history [documentation](https://github.com/mjackson/history#properties)*

```js
<Route path="/user/:id" component={User}/>
```

```js
import React, { PropTypes } from 'react'
const { string, shape, number, bool, object } = PropTypes

class User extends React.Component {
  propTypes: {
    history: shape({
      action: string,
      length: number,
      location: shape({
        pathname: string,
        search: string,
        hash: string
      })
    }),
    match: shape({
      isExact: bool,
      params: object,
      path: string,
      url: string,
    })
  },
  render() {
    const { id } = this.props.match.params

    return <pre>{JSON.stringify(this.props, null, 2)}</pre>
  }
}
```

## render: func _Route_

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

## children: func _Route_

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

## location: object _Route_

If you don't want to match the location on context, you can pass a location as a prop instead.

```js
<Route path="/foo" location={{ pathname: '/foo' }}/>
```

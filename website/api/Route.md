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

A React component to render when the location matches. The component will be rendered with the following props:

- `action`: the current action (`PUSH`, `REPLACE`, or `POP`)
- `location`: the current location
- `pathname`: (string) the portion of `location.pathname` matched
- `isExact`: (bool) whether or not the match is exact (v. partial)
- `params`: the values parsed from the pathname corresponding by name to the dynamic segments of the path

```js
class User extends React.Component {
  render() {
    const { location, pathname, isExact } = this.props
    const { id } = this.props.params

    return <pre>{JSON.stringify(this.props, null, 2)}</pre>
  }
}

<Route path="/user/:id" component={User}/>
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

Sometimes you need to render whether the path matches the location or not. In these cases, you can use the function `children` prop. It works exactly like `render` except that (1) it gets called whether there is a match or not and (2) includes a `matched` prop to indicate if there was a match.

Here's how to get an `active` classname onto a bootstrap-style list item:

```js
<ul>
  <ListItemLink to="/somewhere"/>
  <ListItemLink to="/somewhere-else"/>
</ul>

const ListItemLink = ({ to, ...rest }) => (
  <Route path={to}>
    {({ matched, ...rest }) => (
      <li className={matched ? 'active' : ''}>
        <Link to={to} {...rest}/>
      </li>
    )}
  </Route>
)
```

Could also be useful for animations:

```js
<Route children={({ matched, ...rest}) => (
  {/* Animate will always render, so you can use lifecycles
      to animate its child in and out */}
  <Animate>
    {matched && <Something {...rest}/>}
  </Animate>
)}/>
```

## location: object _Route_

If you don't want to match the location on context, you can pass a location as a prop instead.

```js
<Route path="/foo" location={{ pathname: '/foo' }}/>
```

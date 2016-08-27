# `<Match>`

Renders UI when a pattern matches a location.

## `pattern: string`

Any valid URL pattern that [`path-to-regexp`][ptre] understands.

```js
<Match pattern="/users/:id" component={User}/>
```

## `exactly: bool`

When `true`, will only match if the pattern matches the
`location.pathname` _exactly_.

| pattern   |  location.pathname  | exactly?   | matches?   |
|---|---|---|---|---|
| `/foo`  | `/foo/bar`  | yes | no |
| `/foo`  | `/foo/bar`  | no | yes |

```js
<Match pattern="/foo" exactly component={Foo}/>
```

## `location`

If you don't want to match the location on context, you can pass a
location as a prop instead.

```js
<Match pattern="/foo" location={{ pathname: '/foo' }}/>
```

## `component`

A React component constructor to render when the location matches. The
component will be rendered with the following props:

- `pattern`: (string) the portion of the pattern matched.
- `pathame`: (string) the portion of pathname matched.
- `isExact`: (bool) whether or not the match is exact (v. partial).
- `location`: the location matched.
- `params`: the values parsed from the pathname corresponding by name to
  the dynamic segments of the pattern.

```js
class User extends React.Component {
  render() {
    const { location, pattern, pathame, isExact } = this.props
    const { id } = this.props.params

    return <pre>{JSON.stringify(this.props, null, 2)}</pre>
  }
}

<Match pattern="/user/:id" component={User}/>
```

## `render: func`

Instead of having a `component` rendered for you, you can pass in a
function to be called when the location matches. Your render function
will be called with the same props that are passed to the `component`.

This allows for convenient inline match rendering and wrapping.

```js
// convenient inline rendering
<Match pattern="/home" render={() => <div>Home</div>}/>

// wrapping/composing
const MatchWithFade = ({ component:Component, ...rest }) => (
  <Match {...rest} render={(matchProps) => (
    <FadeIn>
      <Component {...matchProps}/>
    </FadeIn>
  )}/>
)

<MatchWithFade pattern="/cool" component={Something}/>
```

## `children: func`

Sometimes you need to render whether the pattern matches the location or
not. In these cases, you can use the function `children` prop. It works
exactly like `render` except that (1) it gets called whether there is a
match or not and (2) includes a `matched` prop to indicate if there was
a match.

It seems unlikely you'll need this for anything besides animating when a
component transitions from matching to not matching and back, but who
knows?

```js
<Match children={({ matched, ...rest}) => (
  {/* Animate will always render, so you can use lifecycles
      to animate its children */}
  <Animate>
    {matched && (
      <Something {...rest}/>
    )}
  </Animate>
)}/>
```

# `</Match>`

  [ptre]:https://www.npmjs.com/package/path-to-regexp

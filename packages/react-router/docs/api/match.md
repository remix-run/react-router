# match

A `match` object contains information about how a `<Route path>` matched the URL. `match` objects contain the following properties:

  - `params` - (object) Key/value pairs parsed from the URL corresponding to the dynamic segments of the path
  - `isExact` - (boolean) `true` if the entire URL was matched (no trailing characters)
  - `path` - (string) The path pattern used to match. Useful for building nested `<Route>`s
  - `url` - (string) The matched portion of the URL. Useful for building nested `<Link>`s

You'll have access to `match` objects in various places:

- [Route component](./Route.md#component) as `this.props.match`
- [Route render](./Route.md#render-func) as `({ match }) => ()`
- [Route children](./Route.md#children-func) as `({ match }) => ()`
- [withRouter](./withRouter.md) as `this.props.match`
- [matchPath](./matchPath.md) as the return value

If a Route does not have a `path`, and therefore always matches, you'll get the closest parent match. Same goes for `withRouter`.

## null matches

A `<Route>` that uses the `children` prop will call its `children` function even when the route's `path` does not match the current location. When this is the case, the `match` will be `null`. Being able to render a `<Route>`'s contents when it does match can be useful, but certain challenges arise from this situation.

The default way to "resolve" URLs is to join the `match.url` string to the "relative" path.

```js
`${match.url}/relative-path`
```

If you attempt to do this when the match is `null`, you will end up with a `TypeError`. This means that it is considered unsafe to attempt to join "relative" paths inside of a `<Route>` when using the `children` prop.

A similar, but more subtle situation occurs when you use a pathless `<Route>` inside of a `<Route>` that generates a `null` match object.

```js
// location.pathname = '/matches'
<Route path='/does-not-match' children={({ match }) => (
  // match === null
  <Route render={({ match:pathlessMatch }) => (
    // pathlessMatch === ???
  )}/>
)}/>
```

Pathless `<Route>`s inherit their `match` object from their parent. If their parent `match` is `null`, then their match will also be `null`. This means that a) any child routes/links will have to be absolute because there is no parent to resolve with and b) a pathless route whose parent `match` can be `null` will need to use the `children` prop to render.

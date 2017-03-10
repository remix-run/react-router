# match

A `match` object contains information about how a `<Route path>` matched the URL. `match` objects contain the following properties:

  - `params` - (object) Key/value pairs parsed from the URL corresponding to the dynamic segments of the path
  - `isExact` - `true` if the entire URL was matched (no trailing characters)
  - `path` - (string) The path pattern used to match. Useful for building nested `<Route>`s
  - `url` - (string) The matched portion of the URL. Useful for building nested `<Link>`s

You'll have access `match` objects in various places:

- [Route component](./Route.md#component) as `this.props.match`
- [Route render](./Route.md#render-func) as `({ match }) => ()`
- [Route children](./Route.md#children-func) as `({ match }) => ()`
- [withRouter](./withRouter.md) as `this.props.match`
- [matchPath](./withRouter.md) as the return value

If a Route does not have a `path`, and therefore always matches, you'll get the closest parent match. Same goes for `withRouter`.


# context.router

Every [`<Router>`](Router.md) puts a `router` object on [`context`](https://facebook.github.io/react/docs/context.html). This object opens a channel of communication between e.g. a `<Router>` and its descendant [`<Route>`](Route.md)s, [`<Link>`](../../react-router-dom/docs/Link.md)s, and [`<Prompt>`](Prompt.md)s, etc.

While this interface is mainly for internal use, it can also occasionally be useful as public API. However, we encourage you to use it only as a last resort. Context itself is an experimental API and may break in a future release of React. All of the rendering methods in [`<Route>`](Route.md) receive all the properties on `context.router`, so you shouldn't ever need to access it directly for rendering.

It may be helpful to think of `context.router` as the merging together of two interfaces:

  1. the [history](history.md) object and
  2. the [match](match.md) object.

Expressed in code, `context.router` would be

```js
context.router = {
  ...history,
  match
}
```

Thus, the `router` object has all methods and properties of its underlying `history` instance (and updates in place the same as the `history` instance) with an additional `match` object that describes how the router matched the URL.

Just as components are nested, `context.router` objects are nested and create a hierarchy. Each time you render a new [`<Route>`](Route.md), it shadows `context.router` to be the point of reference for all its descendants. This lets us express nested routes by simply nesting components.

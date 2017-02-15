# context.router

Every [`<Router>`](#router) puts a `router` object on [`context`](https://facebook.github.io/react/docs/context.html). This object opens a channel of communication between e.g. a `<Router>` and its descendant `<Route>`s, `<Link>`s, and `<Prompt>`s, etc.

While this interface is mainly for internal use, it can also occasionally be useful as public API. However, we encourage you to use it only as a last resort. Context itself is an experimental API and may break in a future release of React.

It may be helpful to think of `context.router` as the merging together of two interfaces:

  1. the [history](#history) object and
  2. the [match](#match) object.

Expressed in code, `context.router` would be

```js
context.router = {
  ...history,
  match
}
```

Thus, the `router` object has all methods and properties of its underlying `history` instance (and updates in place the same as the `history` instance) with an additional `match` object that describes how the router matched the URL.

Just as components are nested, `context.router` objects are nested and create a hierarchy. Each time you render a new `<Route>`, it shadows `context.router` to be the point of reference for all its descendants. This lets us express nested routes by simply nesting components.

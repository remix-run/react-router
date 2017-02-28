# context.history

Every [`<Router>`](Router.md) puts its [`history`](history.md) object on [`context`](https://facebook.github.io/react/docs/context.html) as `context.history`. This object is used internally to open a channel of communication between e.g. a `<Router>` and its descendant [`<Route>`](Route.md)s, [`<Link>`](../../react-router-dom/docs/Link.md)s, and [`<Prompt>`](Prompt.md)s, etc.

`context.history` is also occasionally useful as public API, for example, in instances when you need to access the router's imperative API directly. However, we encourage you to use `context.history` only as a last resort. Context itself is an experimental API and may break in a future release of React.

All of the rendering methods in [`<Route>`](Route.md) receive all the properties on `context.history`, so you shouldn't ever need to access it directly for rendering. Also, you can navigate (`push` or `replace`) using a [`<Redirect>`](Redirect.md) element.

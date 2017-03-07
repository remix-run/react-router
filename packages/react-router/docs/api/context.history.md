# context.history

Warning! The objects provided on context are not considered public API.

Every [`<Router>`](Router.md) puts its [`history`](history.md) object on [`context`](https://facebook.github.io/react/docs/context.html) as `context.history`. This object is used internally to open a channel of communication between e.g. a `<Router>` and its descendant [`<Route>`](Route.md)s, [`<Link>`](../../react-router-dom/docs/Link.md)s, and [`<Prompt>`](Prompt.md)s, etc.

`context.history` is also occasionally useful as public API, for example, in instances when you need to access the router's imperative API directly. However, we encourage you to use `context.history` only as a last resort. Context itself is an experimental API and may change in a future release of React.

All of the rendering props (`render`, `component`, `children`) in [`<Route>`](Route.md) receive `history` as a prop. It's recommended to access `history` from there instead of from context.

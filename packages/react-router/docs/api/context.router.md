# context.router

React Router uses `context.router` to facilitate communication between a `<Router>` and its descendant [`<Route>`](Route.md)s, [`<Link>`](../../../react-router-dom/docs/api/Link.md)s, [`<Prompt>`](Prompt.md)s, etc.

`context.router` should not be considered public API. Instead, you can access the variables we store on context through the props that are passed to your [`<Route>`](Route.md) component or a component wrapped in [`withRouter`](withRouter.md).

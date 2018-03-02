# context.router

React Router 使用 context.router 来促进 `<Router>` 及其后代 [`<Route>`](Route.md)，[`<Link>`](../../../react-router-dom/docs/api/Link.md)，[`<Prompt>`](Prompt.md) 等之间的通信。

context.router 不应被视为公共 API。由于上下文本身是一个实验性的 API，并且可能在未来的 React 版本中发生变化，所以应避免直接在组件中访问 `this.context.router`。相反，您可以通过传递给 [`<Route>`](Route.md) 组件或使用 [`withRouter`](withRouter.md) 包裹组件来访问我们在上下文中存储的变量。

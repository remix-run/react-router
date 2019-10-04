# &lt;Router>

The common low-level interface for all router components. Typically apps will use one of the high-level routers instead:

- [`<BrowserRouter>`](../../../react-router-dom/docs/api/BrowserRouter.md)
- [`<HashRouter>`](../../../react-router-dom/docs/api/HashRouter.md)
- [`<MemoryRouter>`](./MemoryRouter.md)
- [`<NativeRouter>`](../../../react-router-native/docs/api/NativeRouter.md)
- [`<StaticRouter>`](./StaticRouter.md)

The most common use-case for using the low-level `<Router>` is to
synchronize a custom history with a state management lib like Redux or Mobx. Note that this is not required to use state management libs alongside React Router, it's only for deep integration.

```jsx
import React from "react"
import ReactDOM from "react-dom"
import { Router } from "react-router"
import { createBrowserHistory } from "history"

const history = createBrowserHistory()

ReactDOM.render(
  <Router history={history}>
    <App />
  </Router>,
  node
)
```

## history: object

A [`history`](https://github.com/ReactTraining/history) object to use for navigation.

```jsx
import React from "react"
import ReactDOM from "react-dom"
import { createBrowserHistory } from "history"

const customHistory = createBrowserHistory()

ReactDOM.render(<Router history={customHistory} />, node)
```

## children: node

A child element to render.

```jsx
<Router>
  <App />
</Router>
```

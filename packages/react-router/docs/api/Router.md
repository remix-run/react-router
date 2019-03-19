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
import { Router } from "react-router";
import { createBrowserHistory } from "history";

const history = createBrowserHistory()

<Router history={history}>
  <App/>
</Router>
```

## history: object

A [`history`](https://github.com/ReactTraining/history) object to use for navigation.

```jsx
import { createBrowserHistory } from "history";

const customHistory = createBrowserHistory();

<Router history={customHistory} />;
```

## children: node

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.

```jsx
<Router>
  <App />
</Router>
```

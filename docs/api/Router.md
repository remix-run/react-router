# &lt;Router>

The common low-level interface for all router components. Higher-level routers include:

- [`<BrowserRouter>`](BrowserRouter.md)
- [`<HashRouter>`](HashRouter.md)
- [`<MemoryRouter>`](MemoryRouter.md)
- [`<NativeRouter>`](NativeRouter.md)
- [`<StaticRouter>`](StaticRouter.md)

Use a `<Router>` directly if you already have a `history` object.

```js
import { Router } from 'react-router'
import createBrowserHistory from 'history/createBrowserHistory'

const history = createBrowserHistory()

<Router history={history}>
  <App/>
</Router>
```

## history: object

A [`history`](https://github.com/ReactTraining/history) object to use for navigation.

## children: node

A [single child element](https://facebook.github.io/react/docs/react-api.html#react.children.only) to render.

# Navigating Outside of Components

While you can use `this.props.router` from `withRouter` to navigate around, many apps want to be able to navigate outside of their components. They can do that with the history the app gives to `Router`.

```jsx
// Your main file that renders a <Router>:
import { Router, browserHistory } from 'react-router'
import routes from './app/routes'

render(
  <Router history={browserHistory} routes={routes} />,
  mountNode
)
```

```jsx
// Somewhere like a Redux middleware or Flux action:
import { browserHistory } from 'react-router'

// Go to /some/path.
browserHistory.push('/some/path')

// Go back to previous location.
browserHistory.goBack()
```

# Navigating Outside of Components

While you can use `this.props.router` from `withRouter` to navigate around, many apps want to be able to navigate outside of their components. They can do that with the history the app gives to `Router`.

```jsx
// your main file that renders a Router
import { Router, browserHistory } from 'react-router'
import routes from './app/routes'
render(<Router history={browserHistory} routes={routes}/>, el)
```

```jsx
// somewhere like a redux/flux action file:
import { browserHistory } from 'react-router'
browserHistory.push('/some/path') // go to /some/path page
browserHistory.goBack() // go back to previous page
```

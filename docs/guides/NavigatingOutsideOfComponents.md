# Navigating Outside of Components

While you can use `this.context.router` to navigate around, many apps want to be able to navigate outside of their components. They can do that with the history the app gives to `Router`.

```js
// your main file that renders a Router
import { Router, browserHistory } from 'react-router'
import routes from './app/routes'
render(<Router history={browserHistory} routes={routes}/>, el)
```

```js
// somewhere like a redux/flux action file:
import { browserHistory } from 'react-router'
browserHistory.push('/some/path')
```

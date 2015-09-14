# Troubleshooting

### How to get previous path?

```js
<Route component={App}>
  {/* ... other routes */}
</Route>

const App = React.createClass({
  getInitialState() {
    return { showBackButton: false }
  },

  componentWillReceiveProps(nextProps) {
    const routeChanged = nextProps.location !== this.props.location
    this.setState({ showBackButton: routeChanged })
  }
})
```

## How can I use React Router with NW.js?

### Warning: Location "/Users/../YourApp/index.html" did not match any routes, source: file:///Users/../YourApp/bundle.js

When using react-router with NW.js you can't use the BrowserHistory since NW.js uses `file:///` paths. Use the HashHistory like this:

```js
// history.js
import createHashHistory from 'react-router/node_modules/history/lib/createHashHistory'
export default createHashHistory()
```

And then import it to render a `<Router>`:
 
 ```js
 // index.js
 import history from './history'
 React.render(<Router history={history}/>, el)
 ```
 
 And now you can use that history object anywhere in your app, to change the current route outside of your components:
 
 ```js
 // actions.js
 import history from './history'
 history.replaceState(null, '/some/path')
 ```
 
 To do this inside your components take a look at the [History Mixin](https://github.com/rackt/react-router/blob/master/docs/api/History.md)

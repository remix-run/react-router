# Troubleshooting

### `this.context.router` is `undefined`
You will need to add the router context type to your component so the router will be available to you.
```js
contextTypes: {
  router: React.PropTypes.func.isRequired
}
```

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

### Component won't render
Route matching happens in the order they are defined (think `if/elseif` statement). In this case, `/about/me` will show the `UserPage` component because `/about/me` matches the first route. You need to reorder your routes if this happens.  
`About` will never be reachable:  
```js
<Router>
  <Route path="/:userName/:id" component={UserPage}/>
  <Route path="/about/me" component={About}/>
</Router>
```

`About` is now be reachable:
```js
<Router>
  <Route path="/about/me" component={About}/>
  <Route path="/:userName/:id" component={UserPage}/>
</Router>
```

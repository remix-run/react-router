# Troubleshooting

### `this.context.router` is `undefined`

You need to add `router` to your component's `contextTypes` to make the router object available to you.

```js
contextTypes: {
  router: Router.PropTypes.router
}
```


### Getting the previous location

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

Route matching happens in the order they are defined (think `if/elseif` statement). In this case, `/about/me` will show the `<UserPage>` component because `/about/me` matches the first route. You need to reorder your routes if this happens. `<About>` will never be reachable:

```js
<Router>
  <Route path="/:userName/:id" component={UserPage}/>
  <Route path="/about/me" component={About}/>
</Router>
```

`About` is now reachable:

```js
<Router>
  <Route path="/about/me" component={About}/>
  <Route path="/:userName/:id" component={UserPage}/>
</Router>
```


### "Required prop was not specified" on route components

You might see this if you are using `React.cloneElement` to inject props into route components from their parents. If you see this, remove `isRequired` from `propTypes` for those props. This happens because React validates `propTypes` when the element is created rather than when it is mounted. For more details, see [facebook/react#4494](https://github.com/facebook/react/issues/4494#issuecomment-125068868).

You should generally attempt to use this pattern as sparingly as possible. In general, it's best practice to minimize data dependencies between route components.


### `<noscript>` with server-side rendering and async routes

Use `match({ history, routes })` on the client side. See [the server rendering guide](guides/ServerRendering.md#async-routes).


### Passing additional values into route components

There are multiple ways to do this depending on what you want to do. You can:

- Define additional values on `<Route>` or the plain route. This will make those values available on `this.props.route` on route components.
- Pass in a `createElement` handler to `<Router>` or `<RouterContext>`. This will allow you to inject additional props into route elements at creation time.
- Define a top-level component above `<Router>` or `<RouterContext>` that exports additional values via `getChildContext`, then access them via context from rendered components.

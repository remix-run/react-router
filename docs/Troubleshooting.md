# Troubleshooting

### How do I add `this.props.router` to my component?

You need to wrap your component using `withRouter` to make the router object available to you.

```jsx
const Component = withRouter(
  React.createClass({
    //...
  })
)
```


### Getting the previous location

```jsx
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

Route matching happens in the order they are defined (think `if/else if` statement). In this case, `/about/me` will show the `<UserPage>` component because `/about/me` matches the first route. You need to reorder your routes if this happens. `<About>` will never be reachable:

```jsx
<Router>
  <Route path="/:userName/:id" component={UserPage}/>
  <Route path="/about/me" component={About}/>
</Router>
```

`About` is now reachable:

```jsx
<Router>
  <Route path="/about/me" component={About}/>
  <Route path="/:userName/:id" component={UserPage}/>
</Router>
```


### Parent path does not show as active

If your routes look like:

```jsx
<Route path="/">
  <Route path="widgets" component={WidgetList} />
  <Route path="widgets/:widgetId" component={Widget} />
</Route>
```

Then the path `/widgets` will not be considered active when the current path is something like `/widgets/3`. This is because React Router looks at parent _routes_ rather than parent _paths_ to determine active state. To make the path `/widgets` active when the current path is `/widgets/3`, you need to declare your routes as:

```jsx
<Route path="/">
  <Route path="widgets">
    <IndexRoute component={WidgetList} />
    <Route path=":widgetId" component={Widget} />
  </Route>
</Route>
```

As an additional benefit, this also removes the duplication in declaring route paths.


### "Required prop was not specified" on route components

You might see this if you are using `React.cloneElement` to inject props into route components from their parents. If you see this, remove `isRequired` from `propTypes` for those props. This happens because React validates `propTypes` when the element is created rather than when it is mounted. For more details, see [facebook/react#4494](https://github.com/facebook/react/issues/4494#issuecomment-125068868).

You should generally attempt to use this pattern as sparingly as possible. In general, it's best practice to minimize data dependencies between route components.


### Passing additional values into route components

There are multiple ways to do this depending on what you want specifically.

#### Declare properties on the route

You can define additional props on `<Route>` or on the plain route:

```jsx
<Route foo="bar" />
```

These properties will then be available on `this.props.route` on the route component, such as with `this.props.route.foo` above.

#### Inject props to all routes via middleware

You can define a middleware that injects additional props into each route component:

```jsx
const useExtraProps = {
  renderRouteComponent: child => React.cloneElement(child, extraProps)
}
```

You can then use this middleware with:

```jsx
<Router
  history={history}
  routes={routes}
  render={applyRouterMiddleware(useExtraProps)}
/>
```

#### Use a top-level context provider

You can export React context on a top-level provider component, then access this data throughout the tree on rendered components.

```jsx
<ExtraDataProvider>
  <Router history={history} routes={routes} />
</ExtraDataProvider>
```


### `<noscript>` with server-side rendering and async routes

Use `match({ history, routes })` on the client side. See [the server rendering guide](guides/ServerRendering.md#async-routes).

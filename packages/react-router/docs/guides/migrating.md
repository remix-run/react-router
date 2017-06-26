# Migrating from v2/v3 to v4

React Router v4 is a complete rewrite, so there is not a simple migration path. This guide will provide you with a number of steps to help you understand how to upgrade your application.

**Note:** This migration guide is for both React Router v2 and v3, but for brevity, references to previous versions will only mention v3.

* [The Router](#the-router)
* [Routes](#routes)
  * [Nesting Routes](#nesting-routes)
  * [on* properties](#on-properties)
  * [Switch](#switch)
  * [Redirect](#redirect)

## The Router

In React Router v3, there was a single `<Router>` component. It would be provided a `history` object as a prop.

Also, you would provide it your application's route configuration to the `<Router>` either using the `routes` prop or as the `children` of the `<Router>`.

```js
// v3
import routes from './routes'
<Router history={browserHistory} routes={routes} />
// or
<Router history={browserHistory}>
  <Route path='/' component={App}>
    // ...
  </Route>
</Router>
```

With React Router v4, one of the big changes is that there are a number of different router components. Each one will create a `history` object for you. The `<BrowserRouter>` creates a browser history, the `<HashRouter>` creates a hash history, and the `<MemoryRouter>` creates a memory history.

In v4, there is no centralized route configuration. Anywhere that you need to render content based on a route, you will just render a `<Route>` component.

```js
//v4
<BrowserRouter>
  <div>
    <Route path='/about' component={About} />
    <Route path='/contact' component={Contact} />
  </div>
</BrowserRouter>
```

One thing to note is that the router component must only be given one child element.

```js
// yes
<BrowserRouter>
  <div>
    <Route path='/about' component={About} />
    <Route path='/contact' component={Contact} />
  </div>
</BrowserRouter>

// no
<BrowserRouter>
  <Route path='/about' component={About} />
  <Route path='/contact' component={Contact} />
</BrowserRouter>
```

## Routes

In v3, the `<Route>` was not really a component. Instead, all of your application's `<Route>` elements were just used to created a route configuration object.

```js
/// in v3 the element
<Route path='contact' component={Contact} />
// was equivalent to
{
  path: 'contact',
  component: Contact
}
```

With v4, you layout your app's components just like a regular React application. Anywhere that you want to render content based on the location (specifically, its `pathname`), you render a `<Route>`.

The v4 `<Route>` component is actually a component, so wherever you render a `<Route>` component, content will be rendered. When the `<Route>`'s `path` matches the current location, it will use its rendering prop (`component`, `render`, or `children`) to render. When the `<Route>`'s `path` does not match, it will render `null`.

### Nesting Routes

In v3, `<Route>`s were nested by passing them as the `children` of their parent `<Route>`.

```js
<Route path='parent' component={Parent}>
  <Route path='child' component={Child} />
  <Route path='other' component={Other} />
</Route>
```

When a nested `<Route>` matched, React elements would be created using both the child and parent `<Route>`'s `component` prop. The child element would be passed to the parent element as its `children` prop.

```js
<Parent {...routeProps}>
  <Child {...routeProps} />
</Parent>
```

With v4, children `<Route>`s should just be rendered by the parent `<Route>`'s component.

```js
<Route path='parent' component={Parent} />

const Parent = () => (
  <div>
    <Route path='child' component={Child} />
    <Route path='other' component={Other} />
  </div>
)
```

### `on*` properties

React Router v3 provides `onEnter`, `onUpdate`, and `onLeave` methods. These were essentially recreating React's lifecycle methods.

With v4, you should use the lifecycle methods of the component rendered by a `<Route>`. Instead of `onEnter`, you would use `componentDidMount` or `componentWillMount`. Where you would use `onUpdate`, you can use `componentDidUpdate` or `componentWillUpdate` (or possibly `componentWillReceiveProps`). `onLeave` can be replaced with `componentWillUnmount`.

### `<Switch>`

In v3, you could specify a number of child routes, and only the first one that matched would be rendered.

```js
// v3
<Route path='/' component={App}>
  <IndexRoute component={Home} />
  <Route path='about' component={About} />
  <Route path='contact' component={Contact} />
</Route>
```

v4 provides a similar functionality with the `<Switch>` component. When a `<Switch>` is rendered, it will only render the first child `<Route>` that matches the current location.

```js
// v4
const App = () => (
  <Switch>
    <Route exact path='/' component={Home} />
    <Route path='/about' component={About} />
    <Route path='/contact' component={Contact} />
  </Switch>
)

```

### `<Redirect>`

In v3, if you wanted to redirect from one path to another, for instance / to /welcome, you would use `<IndexRedirect >`.

```js
// v3
<Route path="/" component={App}>
  <IndexRedirect to="/welcome" />
</Route>

```

In v4, you can achieve the same functionality using `<Redirect>`.

```js
// v4
<Route exact path="/" render={() => <Redirect to="/welcome" component={App} />} />

```

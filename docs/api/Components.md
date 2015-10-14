# Components

- [`Router`](#Router)
- [`Link`](#Link)
- [`IndexLink`](#IndexLink)
- [`RoutingContext`](#RoutingContext)

## <a id='Router'></a>[`Router`](#Router)
Primary component of React Router. It keeps your UI and the URL in sync.

#### Props
##### `children` (required)
One or many [`Routes`](ConfigurationComponents.md#Route) or [`PlainRoutes`](ConfigurationComponents.md#PlainRoute). When the history changes, `<Router>` will match a branch of its [`Routes`](ConfigurationComponents.md#Route), and render their configured [components](ConfigurationComponents.md), with child route components nested inside the parents.

##### `routes`
Alias for `children`.

##### `history`
The history the router should listen to from the `history` package.

##### `createElement(Component, props)`
When the router is ready to render a branch of route components, it will use this function to create the elements. You may want to take control of creating the elements when you're using some sort of data abstraction, like setting up subscriptions to stores, or passing in some sort of application module to each component via props.  

```js
<Router createElement={createElement} />

// default behavior
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <Component {...props}/>
}

// maybe you're using something like Relay
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <RelayContainer Component={Component} routerProps={props}/>
}
```

##### `stringifyQuery(queryObject)`
A function used to convert an object from [`Link`](#Link)s or calls to `pushState` to a URL query string.

##### `parseQueryString(queryString)`
A function used to convert a query string into an object that gets passed to route component props.

##### `onError(error)`
While the router is matching, errors may bubble up, here is your opportunity to catch and deal with them. Typically these will come from async features like [`route.getComponents`](ConfigurationComponents.md#getComponents) and [`route.getChildRoutes`](ConfigurationComponents.md#getChildRoutes).

##### `onUpdate()`
Called whenever the router updates its state in response to URL changes.

#### Examples
Please see the [`examples/`](/examples) directory of the repository for extensive examples of using `Router`.



## <a id='Link'></a>[`Link`](#Link)
The primary way to allow users to navigate around your application. `<Link>` will render a fully accessible anchor tag with the proper href.

A `<Link>` also knows when the route it links to is active and automatically applies its `activeClassName` and/or `activeStyle` when it is.

#### Props
##### `to`
The path to link to, e.g. `/users/123`.

##### `query`
An object of key:value pairs to be stringified.

##### `hash`
A hash to put in the URL, e.g. `#a-hash`.

##### `state`
State to persist to the `location`.

##### `activeClassName`
The className a `<Link>` receives when its route is active. No active class by default.

##### `activeStyle`
The styles to apply to the link element when its route is active.

##### `onClick(e)`
A custom handler for the click event. Works just like a handler on an `<a>` tag - calling `e.preventDefault()` or returning `false` will prevent the transition from firing, while `e.stopPropagation()` will prevent the event from bubbling.

##### *others*
You can also pass props you'd like to be on the `<a>` such as a `title`, `id`, `className`, etc.

#### Example
Given a route like `<Route path="/users/:userId" />`:

```js
<Link to={`/users/${user.id}`} activeClassName="active">{user.name}</Link>
// becomes one of these depending on your History and if the route is
// active
<a href="/users/123" class="active">Michael</a>
<a href="#/users/123">Michael</a>

// change the activeClassName
<Link to={`/users/${user.id}`} activeClassName="current">{user.name}</Link>

// change style when link is active
<Link to="/users" style={{color: 'white'}} activeStyle={{color: 'red'}}>Users</Link>
```

## <a id='IndexLink'></a>[`IndexLink`](#IndexLink)
Docs coming so soon!

## <a id='RoutingContext'></a>[`RoutingContext`](#RoutingContext)
A `<RoutingContext>` renders the component tree for a given router state and sets the history object and the current location in context.

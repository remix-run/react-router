# Router

Primary component of React Router. It keeps your UI and the URL in sync.

### Props

#### `children` (required)

One or many [`Routes`](Route.md) or [Plain Routes](PlainRoute.md). When the
history changes, `Router` will match a branch of its [`Routes`](Route.md),
and render their configured [components](RouteComponent.md), with child
route components nested inside the parents.

#### `routes`

Alias for `children`.

#### `history`

The history the router should listen to from the `history` package.

#### `createElement(Component, props)`

When the router is ready to render a branch of route components, it will
use this function to create the elements. You may want to take control
of creating the elements when you're using some sort of data
abstraction, like setting up subscriptions to stores, or passing in some
sort of application module to each component via props.

##### Examples

```js
<Router createElement={createElement}/>

// default behavior
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <Component {...props}/>
}

// maybe you're using something like Relay
function createElement(Component, props) {
  // make sure you pass all the props in!
  return <RelayContainer Component={Component} routerProps={props}/>;
}
```

#### `stringifyQuery(queryObject)`

A function used to convert an object from [`Link`](Link.md)s or calls to
[`transitionTo`](Navigation.md#transitiontopathname-query-state) to a URL query string.

#### `parseQueryString(queryString)`

A function used to convert a query string into an object that gets
passed to route component props.

#### `onError(error)`

While the router is matching, errors may bubble up, here
is your opportunity to catch and deal with them. Typically these will
come from async features like [`route.getComponents`](Route.md#getcomponentscallback) and
[`route.getChildRoutes`](PlainRoute.md#getchildrouteslocation-callback).

#### `onUpdate()`

Called whenever the router updates its state in response to URL changes.

### Examples

Please see the [`examples/`](/examples) directory of the repository for extensive
examples of using `Router`.
# Utilities

- [`useRoutes(createHistory)`](#useRoutes)
- [`createRoutes(routes)`](#createRoutes)
- [`PropTypes`](#PropTypes)

## <a id='useRoutes'></a>[`useRoutes(createHistory)`](#useRoutes)
Returns a new `createHistory` function that may be used to create history objects that know about routing.

- listen((error, nextState) => {})
- listenBeforeLeavingRoute(route, (nextLocation) => {})
- match(location, (error, redirectLocation, nextState) => {})
- isActive(pathname, query, indexOnly=false)



## <a id='createRoutes'></a>[`createRoutes(routes)`](#createRoutes)
Creates and returns an array of routes from the given object which may be a JSX route, a plain object route, or an array of either.

#### params
##### `routes`
One or many [`Routes`](ConfigurationComponents.md#Route) or [`PlainRoutes`](ConfigurationComponents.md#PlainRoute).


## <a id='PropTypes'></a>[`PropTypes`](#PropTypes)
Coming so soon!

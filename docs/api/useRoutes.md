# `useRoutes(createHistory)`

Returns a new createHistory function that may be used to create history objects that know about routing.

- isActive(pathname, query)
- registerRouteHook(route, (location) => {})
- unregisterRouteHook(route, (location) => {})
- match(location, (error, nextState, nextLocation) => {})
- listen((error, nextState) => {})
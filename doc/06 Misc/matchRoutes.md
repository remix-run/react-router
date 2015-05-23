Matches a set of routes to a path, useful for server rendering, when you
need to match the routes and perform asynchronous work before rendering.

It calls back with the initial state needed for a
[`RouteMatcher`][RouteMatcher] to render.

Example
-------

```js
// server.js
import { matchRoutes } from 'react-router';
import routes from './routes';
matchRoutes('/trainings/2015-05-boulder', routes, (err, initialState) => {
 // send `initialState` to a `RouteMatcher` somewhere
});
```

  [RouteMatcher]:#TODO


import createMemoryHistory from 'history/lib/createMemoryHistory';
import useRoutes from './useRoutes';
import { createRoutes } from './RouteUtils';

export default function match({
  routes,
  history,
  location,
  parseQueryString,
  stringifyQuery
}, cb) {
  let createHistory = history ? () => history : createMemoryHistory;

  let staticHistory = useRoutes(createHistory)({
    routes: createRoutes(routes),
    parseQueryString,
    stringifyQuery
  });

  staticHistory.match(location, function (error, nextLocation, nextState) {
    cb(error, nextLocation, {...nextState, history: staticHistory})
  });
}


import createHistory from 'history/lib/createMemoryHistory'
import { createRoutes } from './RouteUtils'
import useRoutes from './useRoutes'

function match({
  routes,
  location,
  parseQueryString,
  stringifyQuery
}, callback) {
  let history = useRoutes(createHistory)({
    routes: createRoutes(routes),
    parseQueryString,
    stringifyQuery
  })

  history.match(location, function (error, redirectLocation, nextState) {
    callback(error, redirectLocation, nextState && { ...nextState, history })
  })
}

export default match

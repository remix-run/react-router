import createMemoryHistory from 'history/lib/createMemoryHistory'
import createUseRoutes from './useRoutes'
import createRouteUtils from './RouteUtils'

export default function createMatch(React) {

  const useRoutes = createUseRoutes(React);
  const { createRoutes } = createRouteUtils(React)

  function match({
    routes,
    history,
    location,
    parseQueryString,
    stringifyQuery
  }, cb) {
    let createHistory = history ? () => history : createMemoryHistory

    let staticHistory = useRoutes(createHistory)({
      routes: createRoutes(routes),
      parseQueryString,
      stringifyQuery
    })

    staticHistory.match(location, function (error, nextLocation, nextState) {
      let renderProps = nextState ? {...nextState, history: staticHistory} : null
      cb(error, nextLocation, renderProps)
    })
  }

  return match
}

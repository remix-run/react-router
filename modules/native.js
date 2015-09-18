import React from 'react-native'
import createAll from './createAll'

const all = createAll(React)

export const {
  Router,
  Link,
  IndexLink,
  IndexRoute,
  Redirect,
  Route,
  History,
  Lifecycle,
  RouteContext,
  useRoutes,
  createRoutes,
  RoutingContext,
  PropTypes,
  match
} = all

export default all.Router

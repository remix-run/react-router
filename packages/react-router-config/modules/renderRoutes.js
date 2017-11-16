import React from 'react'
import Switch from 'react-router/Switch'
import Route from 'react-router/Route'
import warning from 'warning'

const renderRoutes = (routes, extraProps = {}) => {
  warning(
    !routes || routes.every(r => r.exact === undefined),
    'Deprecation warning: In v5, the "exact" prop will be removed. Instead, ' +
    'exact matching will be the default behavior and you should use the "parent" ' +
    'prop to specify that the route should match for non-exact matches.'
  )

  return routes ? (
    <Switch>
      {routes.map((route, i) => (
        <Route
          key={route.key || i}
          path={route.path}
          exact={route.exact}
          parent={route.parent}
          strict={route.strict}
          render={(props) => (
            <route.component {...props} {...extraProps} route={route}/>
          )}
        />
      ))}
    </Switch>
  ) : null
}

export default renderRoutes

import React from 'react'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import Router from 'react-router/BrowserRouter'

// Some folks find value in a centralized route config.
// A route config is just data, React is great at mapping data
// into components, and `Match` is a component.

////////////////////////////////////////////////////////////
// first our route components
const Main = () => <h2>Main</h2>

const Sandwiches = () => <h2>Sandwiches</h2>

const Tacos = ({ routes }) => (
  <div>
    <h2>Tacos</h2>
    <ul>
      <li><Link to="/tacos/bus">Bus</Link></li>
      <li><Link to="/tacos/cart">Cart</Link></li>
    </ul>

    {routes.map((route, i) => (
      <MatchWithSubRoutes key={i} {...route}/>
    ))}
  </div>
)

const Bus = () => <h3>Bus</h3>

const Cart = () => <h3>Cart</h3>

////////////////////////////////////////////////////////////
// then our route config
const routes = [
  { pattern: '/sandwiches',
    component: Sandwiches
  },
  { pattern: '/tacos',
    component: Tacos,
    routes: [
      { pattern: '/tacos/bus',
        component: Bus
      },
      { pattern: '/tacos/cart',
        component: Cart
      }
    ]
  }
]

// wrap `Match` and use this everywhere instead, then when
// sub routes are added to any route it'll work
const MatchWithSubRoutes = (route) => (
  <Match {...route} render={(props) => (
    // pass the sub-routes down to keep nesting
    <route.component {...props} routes={route.routes}/>
  )}/>
)

const RouteConfigExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/tacos">Tacos</Link></li>
        <li><Link to="/sandwiches">Sandwiches</Link></li>
      </ul>

      {routes.map((route, i) => (
        <MatchWithSubRoutes key={i} {...route}/>
      ))}
    </div>
  </Router>
)

export default RouteConfigExample

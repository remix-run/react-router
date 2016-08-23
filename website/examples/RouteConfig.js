import React from 'react'
import { Router, Match, Link, matchPattern } from 'react-router'

// Some folks find value in a centralized route config.
// A route config is just data, React is great at mapping data
// into components, and `Match` is a component.

////////////////////////////////////////////////////////////
// first our route components
const Main = () => <h2>Main</h2>

const Sandwiches = () => <h2>Sandwiches</h2>

const Tacos = ({ subRoutes }) => (
  <div>
    <h2>Tacos</h2>
    <ul>
      <li><Link to="/tacos/bus">Bus</Link></li>
      <li><Link to="/tacos/cart">Cart</Link></li>
    </ul>

    {subRoutes.map(route => (
      <MatchWithSubRoutes {...route}/>
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
    subRoutes: [
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
// subRoutes are added to any route it'll work
const MatchWithSubRoutes = (route) => (
  <Match {...route} render={(props) => (
    // pass the sub-routes down to keep nesting
    <route.component {...props} subRoutes={route.subRoutes}/>
  )}/>
)

const RouteConfigExample = ({ history }) => (
  <Router history={history}>
    <ul>
      <li><Link to="/tacos">Tacos</Link></li>
      <li><Link to="/sandwiches">Sandwiches</Link></li>
    </ul>

    {routes.map(route => (
      <MatchWithSubRoutes {...route}/>
    ))}
  </Router>
)

export default RouteConfigExample

import React from 'react'
import { render } from 'react-dom'
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router'

import withExampleBasename from '../withExampleBasename'

const App = ({ children }) => (
  <div>
    <h1>Link to Nowhere App</h1>
    <ul>
      <li><Link /></li>
      <li><Link>Nowhere</Link></li>
      <li><Link to="/">Index</Link></li>
      <li><Link to="/somewhere">Somewhere</Link></li>
    </ul>

    {children}
  </div>
)

const Index = () => (
  <div>
    <h2>Welcome to the index 🚀</h2>
  </div>
)

const Somewhere = () => (
  <div>
    <h2>Somewhere</h2>
    <p>You are now somewhere.</p>
  </div>
)

render((
  <Router history={withExampleBasename(browserHistory, __dirname)}>
    <Route path="/" component={App}>
      <IndexRoute component={Index}/>
      <Route path="/somewhere" component={Somewhere}/>
    </Route>
  </Router>
), document.getElementById('example'))

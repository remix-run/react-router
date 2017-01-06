import React from 'react'
import Router from 'react-router/BrowserRouter'
import Switch from 'react-router/Switch'
import Route from 'react-router/Route'
import Link from 'react-router/Link'

const NoMatchExample = () => (
  <Router>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/will-match">Will Match</Link></li>
        <li><Link to="/will-not-match">Will Not Match</Link></li>
        <li><Link to="/also/will/not/match">Also Will Not Match</Link></li>
      </ul>

      <Switch>
        <Route path="/" exact component={Home}/>
        <Route path="/will-match" component={WillMatch}/>
        <Route component={NoMatch}/>
      </Switch>
    </div>
  </Router>
)

const Home = () => (
  <p>
    A <code>&lt;Switch></code> renders the
    first child <code>&lt;Route></code> that
    matches. A <code>&lt;Route></code> with
    no <code>path</code> always matches.
  </p>
)

const WillMatch = () => <h3>Matched!</h3>

const NoMatch = ({ history }) => (
  <div>
    <h3>No match for <code>{history.location.pathname}</code></h3>
  </div>
)

export default NoMatchExample

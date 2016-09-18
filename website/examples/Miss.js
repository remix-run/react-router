import React from 'react'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import Router from 'react-router/BrowserRouter'

const MissExample = ({ history }) => (
  <Router history={history}>
    <div>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/will-match">Will Match</Link></li>
        <li><Link to="/will-not-match">Will Not Match</Link></li>
        <li><Link to="/also/will/not/match">Also Will Not Match</Link></li>
      </ul>

      <Match pattern="/" exactly component={Home}/>
      <Match pattern="/will-match" component={WillMatch}/>
      <Miss component={NoMatch} />
    </div>
  </Router>
)

const Home = () => (
  <p>
    When no sibling <code>Match</code> matches,
    a <code>Miss</code> component will render.
  </p>
)

const WillMatch = () => <h3>Matched!</h3>

const NoMatch = ({ location }) => (
  <div>
    <h3>No match for <code>{location.pathname}</code></h3>
  </div>
)

export default MissExample

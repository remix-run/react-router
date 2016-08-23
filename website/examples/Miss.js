import React from 'react'
import { Router, Miss, Match, Link } from 'react-router'

const MissExample = ({ history }) => (
  <Router history={history}>
    <ul>
      <li><Link to="/">Home</Link></li>
      <li><Link to="/will-match">Will Match</Link></li>
      <li><Link to="/will-not-match">Will Not Match</Link></li>
      <li><Link to="/also/will/not/match">Also Will Not Match</Link></li>
    </ul>

    <Match pattern="/" exactly component={Home}/>
    <Match pattern="/will-match" component={WillMatch}/>
    <Miss component={NoMatch} />
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


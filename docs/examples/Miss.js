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

    <Match pattern="/" exactly children={() => (
      <div>
        <p>
          When no sibling <code>Match</code> matches,
          a <code>Miss</code> component will render its children.
        </p>
      </div>
    )}/>
    <Match pattern="/will-match" children={() => <h3>Matched!</h3>}/>
    <Miss children={({ location }) => (
      <div>
        <h3>No match for <code>{location.pathname}</code></h3>
        <p>But please note that the <code>MatchLocation</code> above this component
           still matched and rendered :D</p>
      </div>
    )}/>
  </Router>
)

export default MissExample


import React from 'react'
import { NoMatches, MatchLocation, Link } from 'react-router'

const NestedNoMatch = () => (
  <div>
    <h2>Netsed No Matches</h2>
    <ul>
      <li><Link to="/nested-no-match/will-match">Will Match</Link></li>
      <li><Link to="/nested-no-match/will-not-match">Will Not Match</Link></li>
      <li><Link to="/nested-no-match/also/will/not/match">Also Will Not Match</Link></li>
    </ul>

    <MatchLocation pattern="/nested-no-match/will-match" children={() => <h3>Matched!</h3>}/>
    <NoMatches children={({ location }) => (
      <div>
        <h3>No match for <code>{location.pathname}</code></h3>
        <p>But please note that the <code>MatchLocation</code> above this component
           still matched and rendered :D</p>
      </div>
    )}/>
  </div>
)

export default NestedNoMatch


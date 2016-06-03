import React from 'react'
import { Miss, Match, Link } from 'react-router'

const NestedMiss = () => (
  <div>
    <h2>Nested Misses</h2>
    <ul>
      <li><Link to="/nested-miss/will-match">Will Match</Link></li>
      <li><Link to="/nested-miss/will-not-match">Will Not Match</Link></li>
      <li><Link to="/nested-miss/also/will/not/match">Also Will Not Match</Link></li>
    </ul>

    <Match pattern="/nested-miss/will-match" children={() => <h3>Matched!</h3>}/>
    <Miss children={({ location }) => (
      <div>
        <h3>No match for <code>{location.pathname}</code></h3>
        <p>But please note that the <code>Match</code> above this component
           still matched and rendered :D</p>
      </div>
    )}/>
  </div>
)

export default NestedMiss

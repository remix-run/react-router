import React from 'react'
import { MatchLocation, Link } from 'react-history'

const Params = ({ pattern }) => (
  <div>
    <h2>Params</h2>
    <ul>
      <li><Link to="/params/netflix">Netflix</Link></li>
      <li><Link to="/params/zillow">Zillow Group</Link></li>
      <li><Link to="/params/yahoo">Yahoo</Link></li>
    </ul>

    {/* can read in the pattern that rendered this to create dynamic sub-routes */}
    <MatchLocation pattern={`${pattern}/:id`} children={Child}/>
  </div>
)

const Child = ({ params }) => (
  <div>
    <h3>ID: {params.id}</h3>
  </div>
)

export default Params


import React from 'react'
import { Router, MatchLocation, Link } from 'react-router'

const Child = ({ params }) => {
  return (
    <div>
      <h3>ID: {params.id}</h3>
    </div>
  )
}

const ParamsExample = ({ history }) => {
  return (
    <Router history={history}>
      <h2>Accounts</h2>
      <ul>
        <li><Link to="/netflix">Netflix</Link></li>
        <li><Link to="/zillow-group">Zillow Group</Link></li>
        <li><Link to="/yahoo">Yahoo</Link></li>
        <li><Link to="/modus-create">Modus Create</Link></li>
      </ul>

      <MatchLocation pattern="/:id" children={Child} />
    </Router>
  )
}

export default ParamsExample


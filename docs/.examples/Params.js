import React from 'react'
import { Router, MatchLocation, Link } from 'react-router'

const Params = ({ history }) => (
  <Router history={history}>
    <ul>
      <li><Link to="/netflix">Netflix</Link></li>
      <li><Link to="/zillow-group">Zillow Group</Link></li>
      <li><Link to="/yahoo">Yahoo</Link></li>
      <li><Link to="/modus-create">Modus Create</Link></li>
    </ul>

    <MatchLocation pattern="/:id" children={Child}/>
  </Router>
)

const Child = ({ params }) => (
  <div>
    <h3>ID: {params.id}</h3>
  </div>
)

export default Params


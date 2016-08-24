import React from 'react'
import Match from 'react-router/Match'
import Miss from 'react-router/Miss'
import Link from 'react-router/Link'
import Redirect from 'react-router/Redirect'
import Router from 'react-router/BrowserRouter'

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

      <Match pattern="/:id" component={Child} />
    </Router>
  )
}

export default ParamsExample


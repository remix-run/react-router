import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link } from 'react-router'

const User = ({ params: { userID }, location: { query } }) => {
  let age = query && query.showAge ? '33' : ''

  return (
    <div className="User">
      <h1>User id: {userID}</h1>
      {age}
    </div>
  )
}

const App = ({ children }) => (
  <div>
    <ul>
      <li><Link to="/user/bob" activeClassName="active">Bob</Link></li>
      <li><Link to={{ pathname: '/user/bob', query: { showAge: true } }} activeClassName="active">Bob With Query Params</Link></li>
      <li><Link to="/user/sally" activeClassName="active">Sally</Link></li>
    </ul>
    {children}
  </div>
)

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="user/:userID" component={User} />
    </Route>
  </Router>
), document.getElementById('example'))

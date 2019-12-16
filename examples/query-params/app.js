/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'

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
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <Route path="user/:userID" component={User} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

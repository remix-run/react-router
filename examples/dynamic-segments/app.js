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
import { browserHistory, Router, Route, Link, Redirect } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'

const App = ({ children }) => (
  <div>
    <ul>
      <li><Link to="/user/123" activeClassName="active">Bob</Link></li>
      <li><Link to="/user/abc" activeClassName="active">Sally</Link></li>
    </ul>
    {children}
  </div>
)

const User = ({ children, params: { userID } }) => (
  <div className="User">
    <h1>User id: {userID}</h1>
    <ul>
      <li><Link to={`/user/${userID}/tasks/foo`} activeClassName="active">foo task</Link></li>
      <li><Link to={`/user/${userID}/tasks/bar`} activeClassName="active">bar task</Link></li>
    </ul>
    {children}
  </div>
)

const Task = ({ params: { userID, taskID } }) => (
  <div className="Task">
    <h2>User ID: {userID}</h2>
    <h3>Task ID: {taskID}</h3>
  </div>
)

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <Route path="user/:userID" component={User}>
          <Route path="tasks/:taskID" component={Task} />
          <Redirect from="todos/:taskID" to="tasks/:taskID" />
        </Route>
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

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
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup'
import { render } from 'react-dom'
import { browserHistory, Router, Route, IndexRoute, Link } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'

import './app.css'

const App = ({ children, location }) => (
  <div>
    <ul>
      <li><Link to="/page1">Page 1</Link></li>
      <li><Link to="/page2">Page 2</Link></li>
    </ul>

    <CSSTransitionGroup
      component="div"
      transitionName="example"
      transitionEnterTimeout={500}
      transitionLeaveTimeout={500}
    >
      {React.cloneElement(children, {
        key: location.pathname
      })}
    </CSSTransitionGroup>
  </div>
)

const Index = () => (
  <div className="Image">
    <h1>Index</h1>
    <p>Animations with One App Router are not different than any other animation.</p>
  </div>
)

const Page1 = () => (
  <div className="Image">
    <h1>Page 1</h1>
    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  </div>
)

const Page2 = () => (
  <div className="Image">
    <h1>Page 2</h1>
    <p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
  </div>
)

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <IndexRoute component={Index}/>
        <Route path="page1" component={Page1} />
        <Route path="page2" component={Page2} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

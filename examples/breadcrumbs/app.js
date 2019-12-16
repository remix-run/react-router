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

import './app.css'

const App = ({ children, routes }) => {
  const depth = routes.length

  return (
    <div>
      <aside>
        <ul>
          <li><Link to={Products.path}>Products</Link></li>
          <li><Link to={Orders.path}>Orders</Link></li>
        </ul>
      </aside>
      <main>
        <ul className="breadcrumbs-list">
          {routes.map((item, index) =>
            (<li key={index}>
              <Link
                onlyActiveOnIndex={true}
                activeClassName="breadcrumb-active"
                to={item.path || ''}>
                {item.component.title}
              </Link>
              {(index + 1) < depth && '\u2192'}
            </li>)
          )}
        </ul>
        {children}
      </main>
    </div>
  )
}

App.title = 'Home'
App.path = '/'


const Products = () => (
  <div className="Page">
    <h1>Products</h1>
  </div>
)

Products.title = 'Products'
Products.path = '/products'

const Orders = () => (
  <div className="Page">
    <h1>Orders</h1>
  </div>
)

Orders.title = 'Orders'
Orders.path = '/orders'

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path={App.path} component={App}>
        <Route path={Products.path} component={Products} />
        <Route path={Orders.path} component={Orders} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

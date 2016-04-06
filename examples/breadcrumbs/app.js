import React, { Component } from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link } from 'react-router'
import './app.css'

class App extends Component {
  render() {
    const depth = this.props.routes.length

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
            {this.props.routes.map((item, index) =>
              <li key={index}>
                <Link
                  onlyActiveOnIndex={true}
                  activeClassName="breadcrumb-active"
                  to={item.path || ''}>
                  {item.component.title}
                </Link>
                {(index + 1) < depth && '\u2192'}
              </li>
            )}
          </ul>
          {this.props.children}
        </main>
      </div>
    )
  }
}

App.title = 'Home'
App.path = '/'


class Products extends React.Component {
  render() {
    return (
      <div className="Page">
        <h1>Products</h1>
      </div>
    )
  }
}

Products.title = 'Products'
Products.path = '/products'

class Orders extends React.Component {
  render() {
    return (
      <div className="Page">
        <h1>Orders</h1>
      </div>
    )
  }
}

Orders.title = 'Orders'
Orders.path = '/orders'

render((
  <Router history={browserHistory}>
    <Route path={App.path} component={App}>
      <Route path={Products.path} component={Products} />
      <Route path={Orders.path} component={Orders} />
    </Route>
  </Router>
), document.getElementById('example'))

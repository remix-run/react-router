import React from 'react/addons'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link } from 'react-router'

require('./app.css')

const history = useBasename(createHistory)({
  basename: '/breadcrumbs'
})

class App extends React.Component {
  static title = 'Home';
  static path = '/';

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

class Products extends React.Component {
  static title = 'Products';
  static path = '/products';

  render() {
    return (
      <div className="Page">
        <h1>Products</h1>
      </div>
    )
  }
}

class Orders extends React.Component {
  static title = 'Orders';
  static path = '/orders';

  render() {
    return (
      <div className="Page">
        <h1>Orders</h1>
      </div>
    )
  }
}

React.render((
  <Router history={history}>
    <Route path={App.path} component={App}>
      <Route path={Products.path} component={Products} />
      <Route path={Orders.path} component={Orders} />
    </Route>
  </Router>
), document.getElementById('example'))

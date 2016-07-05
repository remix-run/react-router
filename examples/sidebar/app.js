import React from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link } from 'react-router'

import withExampleBasename from '../withExampleBasename'
import data from './data'

import './app.css'

const Category = ({ children, params }) => {
  const category = data.lookupCategory(params.category)

  return (
    <div>
      <h1>{category.name}</h1>
      {children || (
        <p>{category.description}</p>
      )}
    </div>
  )
}

const CategorySidebar = ({ params }) => {
  const category = data.lookupCategory(params.category)

  return (
    <div>
      <Link to="/">◀︎ Back</Link>
      <h2>{category.name} Items</h2>
      <ul>
        {category.items.map((item, index) => (
          <li key={index}>
            <Link to={`/category/${category.name}/${item.name}`}>{item.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Item = ({ params: { category, item } }) => {
  const menuItem = data.lookupItem(category, item)

  return (
    <div>
      <h1>{menuItem.name}</h1>
      <p>${menuItem.price}</p>
    </div>
  )
}

const Index = () => (
  <div>
    <h1>Sidebar</h1>
    <p>
      Routes can have multiple components, so that all portions of your UI
      can participate in the routing.
    </p>
  </div>
)

const IndexSidebar = () => (
  <div>
    <h2>Categories</h2>
    <ul>
      {data.getAll().map((category, index) => (
        <li key={index}>
          <Link to={`/category/${category.name}`}>{category.name}</Link>
        </li>
      ))}
    </ul>
  </div>
)

const App = ({ content, sidebar }) => (
  <div>
    <div className="Sidebar">
      {sidebar || <IndexSidebar />}
    </div>
    <div className="Content">
      {content || <Index />}
    </div>
  </div>
)

render((
  <Router history={withExampleBasename(browserHistory, __dirname)}>
    <Route path="/" component={App}>
      <Route path="category/:category" components={{ content: Category, sidebar: CategorySidebar }}>
        <Route path=":item" component={Item} />
      </Route>
    </Route>
  </Router>
), document.getElementById('example'))

import React from 'react'
import { render } from 'react-dom'
import { connect, Provider } from 'react-redux'
import { ConnectedRouter, routerReducer, routerMiddleware } from 'react-router-redux'

import { createStore, applyMiddleware } from 'redux'
import createHistory from 'history/createBrowserHistory'

import { Link } from 'react-router-dom'
import { Route, Switch } from 'react-router'

const history = createHistory()

const store = createStore(
  routerReducer,
  applyMiddleware(routerMiddleware(history)),
)

const ConnectedSwitch = connect(state => ({
  location: state.location
}))(Switch)

const App = () => (
  <ConnectedSwitch>
    <Route exact path="/" component={() => (<h1>Home <Link to="/about">About</Link></h1>)} />
    <Route path="/about" component={() => (<h1>About <Link to="/">Home</Link></h1>)} />
  </ConnectedSwitch>
)

const AppContainer = connect(state => ({
  location: state.location,
}))(App)

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <AppContainer />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'),
)

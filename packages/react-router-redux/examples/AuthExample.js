import React from 'react'
import { render } from 'react-dom'
import { connect, Provider } from 'react-redux'
import {
  ConnectedRouter,
  routerReducer,
  routerMiddleware,
  push
} from 'react-router-redux'

import { createStore, applyMiddleware, combineReducers } from 'redux'
import createHistory from 'history/createBrowserHistory'

import { Route, Switch } from 'react-router'
import { Redirect } from 'react-router-dom'

const history = createHistory()

const authSuccess = () => ({
  type: 'AUTH_SUCCESS'
})

const authFail = () => ({
  type: 'AUTH_FAIL'
})

const initialState = {
  isAuthenticated: false
}

const authReducer = (state = initialState , action) => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true
      }
    case 'AUTH_FAIL':
      return {
        ...state,
        isAuthenticated: false
      }
    default:
      return state
  }
}

const store = createStore(
  combineReducers({ routerReducer, authReducer }),
  applyMiddleware(routerMiddleware(history)),
)

class LoginContainer extends React.Component {
  render() {
    return <button onClick={this.props.login}>Login Here!</button>
  }
}

class HomeContainer extends React.Component {
  componentWillMount() {
    alert('Private home is at: ' + this.props.location.pathname)
  }

  render() {
    return <button onClick={this.props.logout}>Logout Here!</button>
  }
}

class PrivateRouteContainer extends React.Component {
  render() {
    const {
      isAuthenticated,
      component: Component,
      ...props
    } = this.props

    return (
      <Route
        {...props}
        render={props =>
          isAuthenticated
            ? <Component {...props} />
            : (
            <Redirect to={{
              pathname: '/login',
              state: { from: props.location }
            }} />
          )
        }
      />
    )
  }
}

const PrivateRoute = connect(state => ({
  isAuthenticated: state.authReducer.isAuthenticated
}))(PrivateRouteContainer)

const Login = connect(null, dispatch => ({
  login: () => {
    dispatch(authSuccess())
    dispatch(push('/'))
  }
}))(LoginContainer)

const Home = connect(null, dispatch => ({
  logout: () => {
    dispatch(authFail())
    dispatch(push('/login'))
  }
}))(HomeContainer)

render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Switch>
        <Route path="/login" component={Login} />
        <PrivateRoute exact path="/" component={Home} />
      </Switch>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'),
)

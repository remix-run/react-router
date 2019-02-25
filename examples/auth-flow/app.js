import React, { Component } from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link, withRouter } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'
import auth from './auth'

class App extends Component {
  state = {
    loggedIn: auth.loggedIn()
  }

  updateAuth = (loggedIn) => {
    this.setState({
      loggedIn
    })
  }

  UNSAFE_componentWillMount() {
    auth.onChange = this.updateAuth
    auth.login()
  }

  render() {
    return (
      <div>
        <ul>
          <li>
            {this.state.loggedIn ? (
              <Link to="/logout">Log out</Link>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/dashboard">Dashboard</Link> (authenticated)</li>
        </ul>
        {this.props.children || <p>You are {!this.state.loggedIn && 'not'} logged in.</p>}
      </div>
    )
  }
}

class Dashboard extends Component {
  render() {
    const token = auth.getToken()

    return (
      <div>
        <h1>Dashboard</h1>
        <p>You made it!</p>
        <p>{token}</p>
      </div>
    )
  }
}

class LoginBase extends Component {
  state = {
    error: false,
    email: 'joe@example.com',
    pass: ''
  }

  handleSubmit = (event) => {
    event.preventDefault()

    const { email, pass } = this.state

    auth.login(email, pass, (loggedIn) => {
      if (!loggedIn)
        return this.setState({ error: true })

      const { location } = this.props

      if (location.state && location.state.nextPathname) {
        this.props.router.replace(location.state.nextPathname)
      } else {
        this.props.router.replace('/')
      }
    })
  }

  handleChange = ({ target }) => {
    this.setState({ [target.name]: target.value })
  }

  render() {
    const { email, pass } = this.state
    return (
      <form onSubmit={this.handleSubmit}>
        <label><input value={email} name="email" onChange={this.handleChange} placeholder="email" /></label>
        <label><input value={pass} name="pass" onChange={this.handleChange} placeholder="password" /></label> (hint: password1)<br />
        <button type="submit">login</button>
        {this.state.error && (
          <p>Bad login information</p>
        )}
      </form>
    )
  }
}

const Login = withRouter(LoginBase)

class About extends Component {
  render() {
    return <h1>About</h1>
  }
}

class Logout extends Component {
  componentDidMount() {
    auth.logout()
  }

  render() {
    return <p>You are now logged out</p>
  }
}

function requireAuth(nextState, replace) {
  if (!auth.loggedIn()) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname }
    })
  }
}

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <Route path="login" component={Login} />
        <Route path="logout" component={Logout} />
        <Route path="about" component={About} />
        <Route path="dashboard" component={Dashboard} onEnter={requireAuth} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

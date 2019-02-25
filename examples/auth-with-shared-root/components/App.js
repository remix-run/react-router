import React, { Component } from 'react'
import { Link } from '@americanexpress/one-app-router'
import auth from '../utils/auth'

class App extends Component {
  state = {
    loggedIn: auth.loggedIn()
  }

  updateAuth = (loggedIn) => {
    this.setState({
      loggedIn: !!loggedIn
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
          <li><Link to="/">Home</Link> (changes depending on auth status)</li>
          <li><Link to="/page2">Page Two</Link> (authenticated)</li>
          <li><Link to="/user/foo">User: Foo</Link> (authenticated)</li>
        </ul>
        {this.props.children}
      </div>
    )
  }
}

module.exports = App

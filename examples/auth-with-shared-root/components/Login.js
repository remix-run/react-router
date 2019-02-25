import React, { Component } from 'react'
import { withRouter } from '@americanexpress/one-app-router'
import auth from '../utils/auth.js'

class Login extends Component {
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

  handleChange = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
  }

  render() {
    const { email, pass } = this.state
    return (
      <form onSubmit={this.handleSubmit}>
        <label><input value={email} name="email" placeholder="email" onChange={this.handleChange}/></label>
        <label><input value={pass} name="pass" placeholder="password" onChange={this.handleChange}/></label> (hint: password1)<br />
        <button type="submit">login</button>
        {this.state.error && (
          <p>Bad login information</p>
        )}
      </form>
    )
  }
}

module.exports = withRouter(Login)

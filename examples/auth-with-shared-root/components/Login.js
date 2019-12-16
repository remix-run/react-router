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

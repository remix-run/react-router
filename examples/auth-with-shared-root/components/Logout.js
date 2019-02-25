import React, { Component } from 'react'
import auth from '../utils/auth'

class Logout extends Component {
  componentDidMount() {
    auth.logout()
  }

  render() {
    return <p>You are now logged out</p>
  }
}

module.exports = Logout

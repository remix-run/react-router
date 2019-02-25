import React, { Component } from 'react'
import auth from '../utils/auth'

class Dashboard extends Component {
  render() {
    const token = auth.getToken()

    return (
      <div>
        <h1>Dashboard</h1>
        <p>You made it!</p>
        <p>{token}</p>
        {this.props.children}
      </div>
    )
  }
}

module.exports = Dashboard

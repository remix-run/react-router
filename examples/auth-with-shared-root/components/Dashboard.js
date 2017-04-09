import React from 'react'
import createReactClass from 'create-react-class'
import auth from '../utils/auth'

const Dashboard = createReactClass({
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
})

module.exports = Dashboard

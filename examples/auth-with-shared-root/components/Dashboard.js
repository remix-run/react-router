import React from 'react'
import auth from '../utils/auth'

var Dashboard = React.createClass({
  render() {
    var token = auth.getToken()

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

export default Dashboard

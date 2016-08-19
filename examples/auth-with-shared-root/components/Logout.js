import React from 'react'
import auth from '../utils/auth'

const Logout = React.createClass({
  componentDidMount() {
    auth.logout()
  },

  render() {
    return <p>You are now logged out</p>
  }
})

module.exports = Logout

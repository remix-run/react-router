import React from 'react'
import createReactClass from 'create-react-class'
import auth from '../utils/auth'

const Logout = createReactClass({
  componentDidMount() {
    auth.logout()
  },

  render() {
    return <p>You are now logged out</p>
  }
})

module.exports = Logout

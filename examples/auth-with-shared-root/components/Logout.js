import React from 'react'
import auth from '../utils/auth'

var Logout = React.createClass({
  componentDidMount() {
    auth.logout()
  },

  render() {
    return <p>You are now logged out</p>
  }
})

export default Logout

import React, { Component } from 'react'

class User extends Component {
  render() {
    return <h1>User: {this.props.params.id}</h1>
  }
}

module.exports = User

import React, { Component } from 'react'

class Announcements extends Component {
  render() {
    return (
      <div>
        <h3>Announcements</h3>
        {this.props.children || <p>Choose an announcement from the sidebar.</p>}
      </div>
    )
  }
}

module.exports = Announcements

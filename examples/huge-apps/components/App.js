/*globals COURSES:true */
import React from 'react'
import Dashboard from './Dashboard'
import GlobalNav from './GlobalNav'

class App extends React.Component {
  render() {
    return (
      <div>
        <GlobalNav />
        <div style={{ padding: 20 }}>
          {this.props.children || <Dashboard courses={COURSES} />}
        </div>
      </div>
    )
  }
}

module.exports = App

import React from 'react'
import ReactDOM from 'react-dom'
import { createHistory, useBasename } from 'history'
import { Router, Route, Link, History, Lifecycle } from 'react-router'

const history = useBasename(createHistory)({
  basename: '/transitions'
})

const App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to="/dashboard" activeClassName="active">Dashboard</Link></li>
          <li><Link to="/form" activeClassName="active">Form</Link></li>
        </ul>
        {this.props.children}
      </div>
    )
  }
})

const Dashboard = React.createClass({
  render() {
    return <h1>Dashboard</h1>
  }
})

const Form = React.createClass({
  mixins: [ Lifecycle, History ],

  getInitialState() {
    return {
      textValue: 'ohai'
    }
  },

  routerWillLeave() {
    if (this.state.textValue)
      return 'You have unsaved information, are you sure you want to leave this page?'
  },

  handleChange(event) {
    this.setState({
      textValue: event.target.value
    })
  },

  handleSubmit(event) {
    event.preventDefault()

    this.setState({
      textValue: ''
    }, () => {
      this.history.pushState(null, '/')
    })
  },

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <p>Click the dashboard link with text in the input.</p>
          <input type="text" ref="userInput" value={this.state.textValue} onChange={this.handleChange} />
          <button type="submit">Go</button>
        </form>
      </div>
    )
  }
})

ReactDOM.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="dashboard" component={Dashboard} />
      <Route path="form" component={Form} />
    </Route>
  </Router>
), document.getElementById('example'))

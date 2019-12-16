/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import React, { Component } from 'react'
import { render } from 'react-dom'
import { browserHistory, Router, Route, Link, withRouter } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'

class App extends Component {
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
}

class FormBase extends Component {
  constructor(props) {
    super(props)
    this.state = {
      textValue: 'ohai'
    }

    this.props.router.setRouteLeaveHook(
      this.props.route,
      this.routerWillLeave
    )
  }

  routerWillLeave = () => {
    if (this.state.textValue)
      return 'You have unsaved information, are you sure you want to leave this page?'
  }

  handleChange = (event) => {
    this.setState({
      textValue: event.target.value
    })
  }

  handleSubmit = (event) => {
    event.preventDefault()

    this.setState({
      textValue: ''
    }, () => {
      this.props.router.push('/')
    })
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <p>Click the dashboard link with text in the input.</p>
          <input type="text" name="userInput" value={this.state.textValue} onChange={this.handleChange} />
          <button type="submit">Go</button>
        </form>
      </div>
    )
  }
}

const Form = withRouter(FormBase)

class Dashboard extends Component {
  render() {
    return <h1>Dashboard</h1>
  }
}

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <Route path="dashboard" component={Dashboard} />
        <Route path="form" component={Form} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

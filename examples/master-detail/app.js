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
import { browserHistory, Router, Route, IndexRoute, Link, withRouter } from '@americanexpress/one-app-router'

import withExampleBasename from '../withExampleBasename'
import ContactStore from './ContactStore'

import './app.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      contacts: ContactStore.getContacts(),
      loading: true
    }
    ContactStore.init()
  }

  componentDidMount() {
    ContactStore.addChangeListener(this.updateContacts)
  }

  componentWillUnmount() {
    ContactStore.removeChangeListener(this.updateContacts)
  }

  updateContacts = () => {
    this.setState({
      contacts: ContactStore.getContacts(),
      loading: false
    })
  }

  render() {
    const contacts = this.state.contacts.map(function (contact) {
      return <li key={contact.id}><Link to={`/contact/${contact.id}`}>{contact.first}</Link></li>
    })

    return (
      <div className="App">
        <div className="ContactList">
          <Link to="/contact/new">New Contact</Link>
          <ul>
            {contacts}
          </ul>
        </div>
        <div className="Content">
          {this.props.children}
        </div>
      </div>
    )
  }
}

class Index extends Component {
  render() {
    return <h1>Address Book</h1>
  }
}

class ContactBase extends Component {
  constructor(props) {
    super(props)
    this.state = this.getStateFromStore(props)
  }

  getStateFromStore = (props) => {
    const { id } = props ? props.params : this.props.params
    return {
      contact: ContactStore.getContact(id)
    }
  }

  updateContact = () => {
    this.setState(this.getStateFromStore())
  }

  componentDidMount() {
    ContactStore.addChangeListener(this.updateContact)
  }

  componentWillUnmount() {
    ContactStore.removeChangeListener(this.updateContact)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.contact !== state.contact) {
      const { id } = props.params
      return {
        contact: ContactStore.getContact(id)
      }
    }
    return null
  }

  destroy = () => {
    const { id } = this.props.params
    ContactStore.removeContact(id)
    this.props.router.push('/')
  }

  render() {
    const contact = this.state.contact || {}
    const name = contact.first + ' ' + contact.last

    return (
      <div className="Contact">
        <h3>{name}</h3>
        <button onClick={this.destroy}>Delete</button>
      </div>
    )
  }
}

const Contact = withRouter(ContactBase)

class NewContactBase extends Component {
  state = {
    first: '',
    last: ''
  }

  createContact = (event) => {
    event.preventDefault()

    const { first, last } = this.state

    ContactStore.addContact({
      first,
      last
    }, (contact) => {
      this.props.router.push(`/contact/${contact.id}`)
    })
  }

  handleChange = ({ target: { name, value } }) => {
    this.setState({ [name]: value })
  }

  render() {
    const { first, last } = this.state
    return (
      <form onSubmit={this.createContact}>
        <p>
          <input type="text" onChange={this.handleChange} value={first} name="first" placeholder="First name" />
          <input type="text" onChange={this.handleChange} value={last} name="last" placeholder="Last name" />
        </p>
        <p>
          <button type="submit">Save</button> <Link to="/">Cancel</Link>
        </p>
      </form>
    )
  }
}

const NewContact = withRouter(NewContactBase)

class NotFound extends Component {
  render() {
    return <h2>Not found</h2>
  }
}

render((
  <React.StrictMode>
    <Router history={withExampleBasename(browserHistory, __dirname)}>
      <Route path="/" component={App}>
        <IndexRoute component={Index} />
        <Route path="contact/new" component={NewContact} />
        <Route path="contact/:id" component={Contact} />
        <Route path="*" component={NotFound} />
      </Route>
    </Router>
  </React.StrictMode>
), document.getElementById('example'))

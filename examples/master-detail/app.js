import React from 'react'
import { render,} findDOMNode } from 'react-dom'
import { createHistory, useBasename } from 'history'
import { Router, History, Route, IndexRoute, Link } from 'react-router'
import ContactStore from './ContactStore'

require('./app.css')

const history = useBasename(createHistory)({
  basename: '/master-detail'
})

var App = React.createClass({
  getInitialState() {
    return {
      contacts: ContactStore.getContacts(),
      loading: true
    }
  },

  componentWillMount() {
    ContactStore.init()
  },

  componentDidMount() {
    ContactStore.addChangeListener(this.updateContacts)
  },

  componentWillUnmount() {
    ContactStore.removeChangeListener(this.updateContacts)
  },

  updateContacts() {
    if (!this.isMounted())
      return

    this.setState({
      contacts: ContactStore.getContacts(),
      loading: false
    })
  },

  render() {
    var contacts = this.state.contacts.map(function (contact) {
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
})

var Index = React.createClass({
  render() {
    return <h1>Address Book</h1>
  }
})

var Contact = React.createClass({
  mixins: [ History ],

  getStateFromStore(props) {
    var { id } = props ? props.params : this.props.params

    return {
      contact: ContactStore.getContact(id)
    }
  },

  getInitialState() {
    return this.getStateFromStore()
  },

  componentDidMount() {
    ContactStore.addChangeListener(this.updateContact)
  },

  componentWillUnmount() {
    ContactStore.removeChangeListener(this.updateContact)
  },

  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromStore(nextProps))
  },

  updateContact() {
    if (!this.isMounted())
      return

    this.setState(this.getStateFromStore())
  },

  destroy() {
    var { id } = this.props.params
    ContactStore.removeContact(id)
    this.history.pushState(null, '/')
  },

  render() {
    var contact = this.state.contact || {}
    var name = contact.first + ' ' + contact.last
    var avatar = contact.avatar || 'http://placecage.com/50/50'
    return (
      <div className="Contact">
        <img height="50" src={avatar} key={avatar} />
        <h3>{name}</h3>
        <button onClick={this.destroy}>Delete</button>
      </div>
    )
  }
})

var NewContact = React.createClass({
  mixins: [ History ],

  createContact(event) {
    event.preventDefault()

    ContactStore.addContact({
      first: findDOMNode(this.refs.first).value,
      last: findDOMNode(this.refs.last).value
    }, (contact) => {
      this.history.pushState(null, `/contact/${contact.id}`)
    })
  },

  render() {
    return (
      <form onSubmit={this.createContact}>
        <p>
          <input type="text" ref="first" placeholder="First name" />
          <input type="text" ref="last" placeholder="Last name" />
        </p>
        <p>
          <button type="submit">Save</button> <Link to="/">Cancel</Link>
        </p>
      </form>
    )
  }
})

var NotFound = React.createClass({
  render() {
    return <h2>Not found</h2>
  }
})

render((
  <Router history={history}>
    <Route path="/" component={App}>
      <IndexRoute component={Index} />
      <Route path="contact/new" component={NewContact} />
      <Route path="contact/:id" component={Contact} />
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
), document.getElementById('example'))

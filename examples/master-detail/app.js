import React from 'react'
import { render, findDOMNode } from 'react-dom'
import {
  browserHistory, Router, Route, IndexRoute, Link, withRouter
} from 'react-router'
import ContactStore from './ContactStore'
import './app.css'

const App = React.createClass({
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
})

const Index = React.createClass({
  render() {
    return <h1>Address Book</h1>
  }
})

const Contact = withRouter(
  React.createClass({

    getStateFromStore(props) {
      const { id } = props ? props.params : this.props.params

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
      const { id } = this.props.params
      ContactStore.removeContact(id)
      this.props.router.push('/')
    },

    render() {
      const contact = this.state.contact || {}
      const name = contact.first + ' ' + contact.last
      const avatar = contact.avatar || 'http://placecage.com/50/50'

      return (
        <div className="Contact">
          <img height="50" src={avatar} key={avatar} />
          <h3>{name}</h3>
          <button onClick={this.destroy}>Delete</button>
        </div>
      )
    }
  })
)

const NewContact = withRouter(
  React.createClass({

    createContact(event) {
      event.preventDefault()

      ContactStore.addContact({
        first: findDOMNode(this.refs.first).value,
        last: findDOMNode(this.refs.last).value
      }, (contact) => {
        this.props.router.push(`/contact/${contact.id}`)
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
)

const NotFound = React.createClass({
  render() {
    return <h2>Not found</h2>
  }
})

render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Index} />
      <Route path="contact/new" component={NewContact} />
      <Route path="contact/:id" component={Contact} />
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
), document.getElementById('example'))

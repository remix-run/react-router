/** @jsx React.DOM */
var React = require('react');
var Router = require('react-router');
var ContactStore = require('./ContactStore');
var {
  Route,
  DefaultRoute,
  Link,
  NotFoundRoute,
  ActiveRouteHandler,
  Navigation,
  ActiveState
} = Router;

var App = React.createClass({
  getInitialState: function() {
    return {
      contacts: ContactStore.getContacts(),
      loading: true
    };
  },

  componentWillMount: function () {
    ContactStore.init();
  },

  componentDidMount: function() {
    ContactStore.addChangeListener(this.updateContacts);
  },

  componentWillUnmount: function () {
    ContactStore.removeChangeListener(this.updateContacts);
  },

  updateContacts: function () {
    if (!this.isMounted())
      return;

    this.setState({
      contacts: ContactStore.getContacts(),
      loading: false
    });
  },

  render: function() {
    var contacts = this.state.contacts.map(function(contact) {
      return <li key={contact.id}><Link to="contact" params={contact}>{contact.first}</Link></li>
    });
    return (
      <div className="App">
        <div className="ContactList">
          <Link to="new">New Contact</Link>
          <ul>
            {contacts}
          </ul>
          <Link to="/nothing-here">Invalid Link (not found)</Link>
        </div>
        <div className="Content">
          <ActiveRouteHandler/>
        </div>
      </div>
    );
  }
});

var Index = React.createClass({
  render: function() {
    return <h1>Address Book</h1>;
  }
});

var Contact = React.createClass({

  mixins: [ Navigation, ActiveState ],

  getStateFromStore: function(id) {
    var id = this.getActiveParams().id;
    return {
      contact: ContactStore.getContact(id)
    };
  },

  getInitialState: function() {
    return this.getStateFromStore();
  },

  componentDidMount: function() {
    ContactStore.addChangeListener(this.updateContact);
  },

  componentWillUnmount: function () {
    ContactStore.removeChangeListener(this.updateContact);
  },

  componentWillReceiveProps: function() {
    this.setState(this.getStateFromStore());
  },

  updateContact: function () {
    if (!this.isMounted())
      return;

    this.setState(this.getStateFromStore())
  },

  destroy: function() {
    var id = this.getActiveParams().id;
    ContactStore.removeContact(id);
    this.transitionTo('/');
  },

  render: function() {
    var contact = this.state.contact || {};
    var name = contact.first + ' ' + contact.last;
    var avatar = contact.avatar || 'http://placecage.com/50/50';
    return (
      <div className="Contact">
        <img height="50" src={avatar} key={avatar}/>
        <h3>{name}</h3>
        <button onClick={this.destroy}>Delete</button>
      </div>
    );
  }
});

var NewContact = React.createClass({

  mixins: [ Router.Navigation ],

  createContact: function(event) {
    event.preventDefault();
    ContactStore.addContact({
      first: this.refs.first.getDOMNode().value,
      last: this.refs.last.getDOMNode().value
    }, function(contact) {
      this.transitionTo('contact', { id: contact.id });
    }.bind(this));
  },

  render: function() {
    return (
      <form onSubmit={this.createContact}>
        <p>
          <input type="text" ref="first" placeholder="First name"/>
          <input type="text" ref="last" placeholder="Last name"/>
        </p>
        <p>
          <button type="submit">Save</button> <Link to="/">Cancel</Link>
        </p>
      </form>
    );
  }
});

var NotFound = React.createClass({
  render: function() {
    return <h2>Not found</h2>;
  }
});

var routes = (
  <Route handler={App}>
    <DefaultRoute handler={Index}/>
    <Route name="new" path="contact/new" handler={NewContact}/>
    <Route name="contact" path="contact/:id" handler={Contact}/>
    <NotFoundRoute handler={NotFound}/>
  </Route>
);

Router.run(routes, function(Root) {
  React.renderComponent(<Root/>, document.getElementById('example'));
});


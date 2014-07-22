/** @jsx React.DOM */
var React = require('react');
var Router = require('../../modules/main');
var Route = Router.Route;
var Link = Router.Link;

var api = 'http://addressbook-api.herokuapp.com/contacts';
var _contacts = {};
var _changeListeners = [];
var _initCalled = false;

var ContactStore = {

  init: function () {
    if (_initCalled)
      return;

    _initCalled = true;

    getJSON(api, function (err, res) {
      res.contacts.forEach(function (contact) {
        _contacts[contact.id] = contact;
      });

      ContactStore.notifyChange();
    });
  },

  addContact: function (contact, cb) {
    postJSON(api, { contact: contact }, function (res) {
      _contacts[res.contact.id] = res.contact;
      ContactStore.notifyChange();
      if (cb) cb(res.contact);
    });
  },

  removeContact: function (id, cb) {
    deleteJSON(api + '/' + id, cb);
    delete _contacts[id];
    ContactStore.notifyChange();
  },

  getContacts: function () {
    var array = [];

    for (var id in _contacts)
      array.push(_contacts[id]);

    return array;
  },

  getContact: function (id) {
    return _contacts[id];
  },

  notifyChange: function () {
    _changeListeners.forEach(function (listener) {
      listener();
    });
  },

  addChangeListener: function (listener) {
    _changeListeners.push(listener);
  },

  removeChangeListener: function (listener) {
    _changeListeners = _changeListeners.filter(function (l) {
      return listener !== l;
    });
  }

};

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
    console.log('componentDidMount')
    ContactStore.addChangeListener(this.updateContacts);
  },

  componentWillUnmount: function () {
    console.log('componentWillUnmount')
    ContactStore.removeChangeListener(this.updateContacts);
  },

  updateContacts: function (contacts) {
    if (!this.isMounted())
      return;

    this.setState({
      contacts: ContactStore.getContacts(),
      loading: false
    });
  },

  indexTemplate: function() {
    return <h1>Address Book</h1>;
  },

  render: function() {
    var contacts = this.state.contacts.map(function(contact) {
      return <li key={contact.id}><Link to="contact" id={contact.id}>{contact.first}</Link></li>
    });
    return (
      <div className="App">
        <div className="ContactList">
          <Link to="new">New Contact</Link>
          <ul>
            {contacts}
          </ul>
        </div>
        <div className="Content">
          {this.props.activeRouteHandler() || this.indexTemplate()}
        </div>
      </div>
    );
  }
});

var Contact = React.createClass({
  getInitialState: function() {
    return {
      contact: ContactStore.getContact(this.props.params.id)
    };
  },

  componentDidMount: function() {
    ContactStore.addChangeListener(this.updateContact);
  },

  componentWillUnmount: function () {
    ContactStore.removeChangeListener(this.updateContact);
  },

  updateContact: function () {
    if (!this.isMounted())
      return;

    this.setState({
      contact: ContactStore.getContact(this.props.params.id)
    });
  },

  destroy: function() {
    ContactStore.removeContact(this.props.params.id);
    Router.transitionTo('/');
  },

  render: function() {
    var contact = this.state.contact || {};
    var name = contact.first + ' ' + contact.last;
    var avatar = contact.avatar || 'http://placekitten.com/50/50';
    return (
      <div className="Contact">
        <img height="50" src={avatar}/>
        <h3>{name}</h3>
        <button onClick={this.destroy}>Delete</button>
      </div>
    );
  }
});

var NewContact = React.createClass({
  createContact: function(event) {
    event.preventDefault();
    ContactStore.addContact({
      first: this.refs.first.getDOMNode().value,
      last: this.refs.last.getDOMNode().value
    }, function(contact) {
      Router.transitionTo('contact', { id: contact.id });
    });
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
    <Route name="new" path="contact/new" handler={NewContact}/>
    <Route name="not-found" path="contact/not-found" handler={NotFound}/>
    <Route name="contact" path="contact/:id" handler={Contact}/>
  </Route>
);

React.renderComponent(routes, document.body);

// Request utils.

function getJSON(url, cb) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    if (req.status === 404) {
      cb(new Error('not found'));
    } else {
      cb(null, JSON.parse(req.response));
    }
  };
  req.open('GET', url);
  req.send();
}

function postJSON(url, obj, cb) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    cb(JSON.parse(req.response));
  };
  req.open('POST', url);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(JSON.stringify(obj));
}

function deleteJSON(url, cb) {
  var req = new XMLHttpRequest();
  req.onload = cb;
  req.open('DELETE', url);
  req.send();
}

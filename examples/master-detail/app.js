/** @jsx React.DOM */
var Routes = ReactRouter.Routes;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
        <Route name="new" path="contact/new" handler={NewContact} />
        <Route name="not-found" path="contact/not-found" handler={NotFound} />
        <Route name="contact" path="contact/:id" handler={Contact} />
      </Routes>
    );
  }
});

var App = React.createClass({
  getInitialState: function() {
    return {
      contacts: [],
      loading: true
    };
  },

  componentDidMount: function() {
    store.getContacts(function(contacts) {
      this.setState({
        contacts: contacts,
        loading: false
      });
    }.bind(this));
  },

  indexTemplate: function() {
    return <h1>Address Book</h1>;
  },

  render: function() {
    var contacts = this.state.contacts.map(function(contact) {
      return <li key={contact.id}><Link to="contact" id={contact.id}>{contact.first}</Link></li>
    });
    var content = (this.props.activeRoute) ? this.props.activeRoute : this.indexTemplate();
    return (
      <div className="App">
        <div className="ContactList">
          <Link to="new">New Contact</Link>
          <ul>
            {contacts}
          </ul>
        </div>
        <div className="Content">
          {content}
        </div>
      </div>
    );
  }
});

var Contact = React.createClass({
  getInitialState: function() {
    return {
      id: this.props.params.id,
      avatar: 'http://placekitten.com/50/50',
      loading: true
    };
  },

  componentDidMount: function() {
    store.getContact(this.props.params.id, function(contact) {
      contact.loading = false;
      this.setState(contact);
    }.bind(this));
  },

  destroy: function() {
    store.removeContact(this.state.id);
    ReactRouter.transitionTo('/');
  },

  render: function() {
    var name = this.state.first+' '+this.state.last;
    return (
      <div className="Contact">
        <img height="50" src={this.state.avatar}/>
        <h3>{name}</h3>
        <button onClick={this.destroy}>Delete</button>
      </div>
    );
  }
});

var NewContact = React.createClass({
  createContact: function(event) {
    event.preventDefault();
    store.addContact({
      first: this.refs.first.getDOMNode().value,
      last: this.refs.last.getDOMNode().value
    }, function(contact) {
      ReactRouter.transitionTo('contact', {id: contact.id});
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

/*****************************************************************************/
// data store stuff ...

var api = 'http://addressbook-api.herokuapp.com/contacts';

var store = {
  contacts: {
    loaded: false,
    map: {},
    records: []
  },

  getContacts: function(cb) {
    if (store.contacts.loaded) {
      if (cb) cb(store.contacts.records);
    } else {
      getJSON(api, function(err, res) {
        var contacts = res.contacts;
        store.contacts.loaded = true;
        store.contacts.records = contacts;
        store.contacts.map = contacts.reduce(function(map, contact) {
          map[contact.id] = contact;
          return map;
        }, {});
        if (cb) cb(contacts);
      });
    }
  },

  getContact: function(id, cb) {
    var contact = store.contacts.map[id];
    if (contact) {
      if (cb) cb(contact);
    } else {
      var url = api+'/'+id;
      getJSON(url, function(err, res) {
        if (err) {
          return ReactRouter.replaceWith('not-found');
        }
        var contact = res.contact;
        store.contacts.map[contact.id] = contact;
        if (cb) cb(contact);
      });
    }
  },

  addContact: function(contact, cb) {
    postJSON(api, {contact: contact}, function(res) {
      var savedContact = res.contact;
      store.contacts.records.push(savedContact);
      store.contacts.map[contact.id] = savedContact;
      if (cb) cb(savedContact);
    });
  },

  removeContact: function(id, cb) {
    var contact = store.contacts.map[id];
    delete store.contacts.map[id];
    var index = store.contacts.records.indexOf(contact);
    store.contacts.records.splice(index, 1);
    deleteJSON(api+'/'+id, cb);
  }
};

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

React.renderComponent(<Main/>, document.body);


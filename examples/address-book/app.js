/** @jsx React.DOM */
var Routes = ReactRouter.Routes;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
var transitionTo = ReactRouter.transitionTo;

var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
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

  addContact: function() {
    var id = Math.random().toString(36).substring(7);
    var contact = {id: id, first: 'No Name', last: 'McGee'};
    store.addContact(contact, this.updateContacts);
    transitionTo('contact', {id: id});
  },

  updateContacts: function() {
    store.getContacts(function(contacts) {
      this.setState({contacts: contacts});
    }.bind(this));
  },

  render: function() {
    var contacts = this.state.contacts.map(function(contact) {
      return <li><Link to="contact" id={contact.id}>{contact.first}</Link></li>
    });
    var content = this.state.loading ? 'Loading...' : this.props.activeRoute;
    return (
      <div className="App">
        <div className="ContactList">
          <ul>
            {contacts}
          </ul>
          <div className="Toolbar">
            <button onClick={this.addContact}>New Contact</button>
          </div>
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
      id: this.props.id,
      loading: true
    };
  },

  componentDidMount: function() {
    store.getContact(this.props.id, function(contact) {
      contact.loading = false;
      this.setState(contact);
    }.bind(this));
  },

  render: function() {
    var name = this.state.first+' '+this.state.last;
    return (
      <div className="Contact">
        <img src={this.state.avatar}/>
        <h3>{name}</h3>
      </div>
    );
  }
});

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
      getJSON(api, function(res) {
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
      getJSON(url, function(res) {
        var contact = res.contact;
        store.contacts.map[contact.id] = contact;
        if (cb) cb(contact);
      });
    }
  },

  addContact: function(contact, cb) {
    postJSON(api, {contact: contact}, function(res) {
      store.contacts.records.push(contact);
      store.contacts.map[contact.id] = contact;
      if (cb) cb(res.contact);
    });
  }
};

function getJSON(url, cb) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    cb(JSON.parse(req.response));
  };
  req.open('GET', url);
  req.send();
}

function postJSON(url, obj, cb) {
  var req = new XMLHttpRequest();
  req.onload = function() {
    cb(req.response);
  };
  req.open('POST', url);
  req.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  req.send(JSON.stringify(obj));
}

React.renderComponent(<Main/>, document.body);

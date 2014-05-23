/** @jsx React.DOM */
var Routes = rf.router.Routes;
var Route = rf.router.Route;
var Link = rf.router.Link;

var App = React.createClass({
  render: function() {
    return (
      <Routes handler={Main}>
        <Route name="about" path="about" handler={About}/>
        <Route name="contacts" path="contacts" handler={Contacts}>
          <Route name="contact" path="contact/:id" handler={Contact} />
        </Route>
      </Routes>
    );
  }
});

var Main = React.createClass({
  render: function() {
    return (
      <div className="Contacts">
        <h1>Main</h1>
        <ul>
          <li><Link to="about">About</Link></li>
          <li><Link to="contacts">Contacts</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var About = React.createClass({
  render: function() {
    return (
      <div className="About">
        <h2>About</h2>
      </div>
    );
  }
});

var Contacts = React.createClass({

  getInitialState: function() {
    return {
      contacts: []
    };
  },

  componentDidMount: function() {
    store.getContacts(function(contacts) {
      this.setState({contacts: contacts});
    }.bind(this));
  },

  render: function() {
    var contacts = this.state.contacts.map(function(contact) {
      return <li><Link to="contact" id={contact.id}>{contact.first}</Link></li>
    });
    return (
      <div className="Contacts">
        <h2>Contacts</h2>
        <ul>
          {contacts}
        </ul>
        {this.props.activeRoute}
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
    var name = this.state.loading ? '' : this.state.first + ' ' + this.state.last;
    return (
      <div className="Contact">
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
    postJSON(api, contact, function(res) {
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
  obj.id = Date.now();
  cb({contact: obj});
}

React.renderComponent(<App/>, document.body);

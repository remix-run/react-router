/** @jsx React.DOM */
var api = 'http://localhost:5000/contacts';
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
      <div className="Main">
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
  render: function() {
    return (
      <div className="Contacts">
        <h2>Contacts</h2>
        <ul>
          <li><Link to="contact" id="123">Contact</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var Contact = React.createClass({
  render: function() {
    return (
      <div className="Contact">
        <h3>Contact {this.props.id}</h3>
      </div>
    );
  }
});


React.renderComponent(<App/>, document.body);






























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



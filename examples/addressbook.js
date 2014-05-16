/** @jsx React.DOM */
var api = 'http://localhost:5000/contacts';
var Routes = rf.router.Routes;
var Route = rf.router.Route;
var Link = rf.router.Link;

var App = React.createClass({
  render: function() {
    return (
      <div class="App">
        <ul>
          <li><Link to="contacts">Contacts</Link></li>
          <li><Link to="about">About</Link></li>
        </ul>
        <Routes>
          <Route name="contacts" path="/" handler={Contacts}/>
          <Route name="about" path="/about" handler={About}/>
        </Routes>
      </div>
    );
  }
});

var Contacts = React.createClass({
  render: function() {
    return (
      <div className="Contacts">
        <h1>Contacts</h1>
      </div>
    );
  }
});

var About = React.createClass({
  render: function() {
    return (
      <div className="About">
        <h1>About</h1>
      </div>
    );
  }
});



//var App = React.createClass({

  //getInitialState: function() {
    //return { contacts: [] };
  //},

  //componentDidMount: function() {
    //store.getContacts(function(contacts) {
      //this.setState({contacts: contacts});
    //}.bind(this));
  //},

  //addContact: function(contact) {
    //store.addContact(contact);
    //store.getContacts(function(contacts) {
      //this.setState({contacts: contacts});
    //}.bind(this));
  //},

  //render: function() {
    //return (
      //<Contacts contacts={this.state.contacts}>
        //<Contact path="/contact/:id"/>
        //<NewContactForm path="/new" onCreateContact={this.addContact}/>
      //</Contacts>
    //);
  //}
//});

//var Contacts = React.createClass({

  //mixins: [Route],

  //render: function() {
    //var contacts = this.props.contacts.map(function(contact) {
      //var url = '/contact/'+contact.id;
      //return <li><Link to={url}>{contact.first} {contact.last}</Link></li>
    //});
    //var detail = this.state.activeChild || <p>Choose somebody from the left</p>;
    //return (
      //<div className="Contacts">
        //<div className="master">
          //<div><Link to="/new">Add Contact</Link></div>
          //<ul>{contacts}</ul>
        //</div>
        //<div className="detail">
          //{detail}
        //</div>
      //</div>
    //);
  //}
//});

//var Contact = React.createClass({
  //mixins: [Route],

  //getInitialState: function() {
    //return { contact: { first: 'dude', last: 'man'}, params: {id: null} };
  //},

  //componentDidMount: function() {
    //store.getContact(this.state.params.id, function(contact) {
      //this.setState({contact: contact});
    //}.bind(this));
  //},

  //render: function() {
    //var contact = this.state.contact;
    //return (
      //<div className="Contact">
        //{this.state.params.id}
        //<img src={contact.avatar} border="1"/>
        //<h2>{contact.first} {contact.last}</h2>
        //<p>{contact.first} {contact.last}</p>
      //</div>
    //);
  //}
//});

//var NewContactForm = React.createClass({
  //handleSubmit: function(event) {
    //event.preventDefault();
    //var first = this.refs.first.getDOMNode();
    //var contact = {
      //first: first.value,
      //last: this.refs.last.getDOMNode().value
    //};
    //this.props.onCreateContact(contact);
    //this.refs.form.getDOMNode().reset();
    //first.focus();
  //},

  //render: function() {
    //return (
      //<div className="NewContactForm">
        //<form ref="form" onSubmit={this.handleSubmit}>
          //<p><label>First: <input ref="first"/></label></p>
          //<p><label>Last: <input ref="last"/></label></p>
          //<button type="submit">Add Contact</button>
        //</form>
      //</div>
    //);
  //}
//});

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


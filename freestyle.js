var Routes = React.createClass({
  render: function() {
    return (
      <Route handler={Application}>
        <IndexRoute hander={Index}/>
        <Route name="about" path="about" handler={About}/>
        <Route name="contacts" path="contacts" handler={Contacts}>
          <IndexRoute handler={ContactsIndex}/>
          <Route name="contact" path=":id" handler={Contact}/>
        </Route>
      </Route>
    );
  }
});

var Application = React.createClass({
  render: function() {
    return (
      <div className="Application">
        <h1>Application</h1>
        <ul>
          <li><Link to="about">About</Link></li>
          <li><Link to="contacts">Contacts</Link></li>
        </ul>
        {this.props.activeChild}
      </div>
    );
  }
});

var Index = React.createClass({
  render: function() {
    return (
      <div className="Index">
        <h2>Index</h2>
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
    return {contacts: getContacts()};
  },

  render: function() {
    var contacts = this.state.contacts.map(function(contact) {
      return (
        <li>
          <Link to="contacts.contact" id={contact.id}>{contact.name}</Link>
        </li>
      );
    });
    return (
      <div className="Contacts">
        <h2>Contacts</h2>
        <ul>
          {contacts}
        </ul>
        {this.props.activeChild}
      </div>
    );
  }
});

var Contact = React.createClass({

  getInitialState: function() {
    return { contact: {} };
  },

  componentDidMount: function() {
    this.setState({
      contact: getContact(this.props.id)
    });
  },

  render: function() {
    return (
      <div className="Contacts">
        <h3>{this.state.contact.name}</h3>
      </div>
    );
  }
});

function getContacts() {
  return [{name: 'Ryan', id: 0}, {name: 'Michael', id: 1}];
}

function getContact(id) {
  return getContacts()[parseInt(id, 10)];
}

React.renderComponent(<Routes/>, document.body);


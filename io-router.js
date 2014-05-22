var routes = route('/', function() {
  return (
    <Main>
      <Index/>
    </Main>
  );
}, function(route) {

  route('about', function() {
    return (
      <Main>
        <About/>
      </Main>
    )
  });

  route('contacts', function() {
    return (
      <Main>
        <Contacts>
          <ContactsIndex/>
        </Contacts>
      </Main>
    );
  }, function(route) {

    route('contact', ':id', function(params) {
      return (
        <Main>
          <Contacts>
            <Contact id={params.id}>
          </Contacts>
        </Main>
      );
    });
  });
});

react.renderComponent(routes, document.body);

var Main = React.createClass({
  render: function() {
    return (
      <div>
        <ul>
          <li><Link to="contacts">Contacts</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var MainIndex = React.createClass({
  render: function() {
    return (
      <div className="MainIndex">
        <h2>Main Index</h2>
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
        {this.props.children}
      </div>
    );
  }
});

var ContactsIndex = React.createClass({
  render: function() {
    return (
      <div className="ContactsIndex">
        <h2>Contacts Index</h2>
      </div>
    );
  }
});

var Contact = React.createClass({
  render: function() {
    return (
      <div className="Contacts">
        <h3>Contacts</h3>
        <h4>id: {this.props.id}</h4>
      </div>
    );
  }
});

function getContacts() {
  return [{name: 'Ryan', id: 1}, {name: 'Michael', id: 2}];
}

React.renderComponent(<R

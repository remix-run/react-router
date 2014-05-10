/** @jsx React.DOM */
var api = 'http://addressbook-api.herokuapp.com/contacts';

var App = React.createClass({
  mixins: [Routed],

  render: function() {
    return (
      <Root>
        <Index path="/"/>
        <Users path="/users/"/>
        <User path="/user/:id"/>
        <About path="/about">
          <AboutIndex path="/about/"/>
          <Company path="/about/company"/>
          <Contact path="/contact"/>
        </About>
      </Root>
    );
  }
});

var Root = React.createClass({
  mixins: [Routed],

  render: function() {
    return (
      <div className="Root">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about/">About</Link></li>
          <li><Link to="/users/">Users</Link></li>
        </ul>
        {this.outlet()}
      </div>
    );
  }
});

var Index = React.createClass({
  mixins: [Routed],
  render: function() {
    return (
      <div className="Index">
        <h1>Index</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var Users = React.createClass({
  mixins: [Routed],

  statics: {
    cache: null
  },

  getInitialState: function() {
    return {users: Users.cache || []};
  },

  componentDidMount: function() {
    if (!Users.cache) {
      $.getJSON(api).then(function(res) {
        Users.cache = res.contacts;
        this.setState({users: res.contacts});
      }.bind(this));
    }
  },

  render: function() {
    var users = this.state.users.map(function(user) {
      var url = "/user/"+user.id;
      return <Link to={url}>{user.first} {user.last}</Link>;
    });
    var content = !users.length ? 'Loading users...' : users;
    return <div className="Users">{content}</div>;
  }
});

var User = React.createClass({
  mixins: [Routed],

  statics: {
    cache: null
  },

  getInitialState: function() {
    return { user: User.cache || null };
  },

  componentDidMount: function() {
    if (User.cache) {
      return;
    }
    var url = api+'/'+this.state.params.id;
    $.getJSON(url).then(function(res) {
      User.cache = res.contact;
      this.setState({ user: res.contact });
    }.bind(this));
  },

  render: function() {
    var content = User.cache ? <h2>User: {this.state.user.first}</h2> : null;
    return (
      <div className="User">
        {content}
      </div>
    );
  }
});

var About = React.createClass({
  mixins: [Routed],
  render: function() {
    return (
      <div className="About">
        <h1>About</h1>
        <ul>
          <li><Link to="/about/company">Company</Link></li>
          <li><Link to="/contact">Contact</Link></li>
        </ul>
        {this.outlet()}
      </div>
    );
  }
});

var AboutIndex = React.createClass({
  mixins: [Routed],
  render: function() {
    return (
      <div className="Index">
        <h1>About Index</h1>
        <p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var Company = React.createClass({
  mixins: [Routed],
  render: function() {
    return <div className="Company"><h2>Company</h2></div>;
  }
});

var Contact = React.createClass({
  mixins: [Routed],
  render: function() {
    return <div className="About"><h2>Contact</h2></div>;
  }
});

React.renderComponent(<App/>, document.body);


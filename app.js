/** @jsx React.DOM */

function pushUrl(path) {
  location.hash = path;
}

function toArray(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}

function childrenArray(component) {
  return component.props.children ? toArray(component.props.children) : [];
}

function matchedChildRoute(path, component) {
  var children = childrenArray(component);
  for (var i = 0, l = children.length; i < l; i ++) {
    if (children[i].props.path === path) {
      return children[i];
    }
  }
  return false;
}

var Link = React.createClass({
  handleClick: function(event) {
    event.preventDefault();
    var path = this.props.to;
    pushUrl(path);
  },

  render: function() {
    return (
      <a href={this.props.to} onClick={this.handleClick}>{this.props.children}</a>
    );
  }
});

var Routed = {

  getInitialState: function() {
    return {activeChild: null};
  },

  componentWillMount: function(path) {
    window.addEventListener('hashchange', this.handleRouteChange, false);
    this.handleRouteChange();
  },

  componentWillUnmount: function() {
    window.removeEventListener('hashchange', this.handleRouteChange);
  },

  handleRouteChange: function() {
    var path = location.hash.substr(1);
    var matched = matchedChildRoute(path, this)
    this.setState({activeChild: matched});
  },

  outlet: function() {
    var children = this.props.children;
    if (!children) throw new Error("you don't have any children, why are you calling outlet()?");
    return this.state.activeChild;
  }

};

var App = React.createClass({
  mixins: [Routed],

  render: function() {
    return (
      <Root path="/">
        <About path="/about"/>
        <Users path="/users"/>
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
          <li><Link to="/about">About</Link></li>
          <li><Link to="/users">Users</Link></li>
        </ul>
        {this.outlet()}
      </div>
    );
  }
});

var About = React.createClass({
  mixins: [Routed],

  render: function() {
    return <div className="About"><h1>About</h1></div>;
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
    var url = 'http://addressbook-api.herokuapp.com/contacts';
    if (!Users.cache) {
      $.getJSON(url).then(function(res) {
        Users.cache = res.contacts;
        this.setState({users: res.contacts});
      }.bind(this));
    }
  },

  render: function() {
    var users = this.state.users.map(function(user) {
      return <div>{user.first} {user.last}</div>;
    });
    var content = !users.length ? 'Loading users...' : users;
    return <div className="Users">{content}</div>;
  }
});

var User = React.createClass({
  mixins: [Routed],

  componentDidMount: function() {
    if (this.props.user) {
      this.setState({user: user});
    } else {
      $.getJSON('/users/'+this.params.id).then(function(user) {
        this.setState({user: user});
      }.bind(this));
    }
  },

  render: function() {
    var use = this.state.user;
    return (
      <div className="User">
        <h1>{user.name}</h1>
        <nav>
          <Link to="UserIndex">User</Link>
          <Link to="UserAbout" user={user}>About</Link>
        </nav>
        {this.props.children}
      </div>
    );
  }
});

var UserIndex = React.createClass({
  mixins: [Routed],

  render: function() {
    return <div className="UserIndex"><h2>User Index</h2></div>
  }
});

var UserAbout = React.createClass({
  mixins: [Routed],

  render: function() {
    var user = this.props.user;
    return (
      <div className="UserIndex">
        <h2>About {user.name}</h2>
        <div>{user.description}</div>
      </div>
    );
  }
});

React.renderComponent(<App/>, document.body);



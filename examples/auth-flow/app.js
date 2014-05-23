/** @jsx React.DOM */
var Routes = rf.router.Routes;
var Route = rf.router.Route;
var Link = rf.router.Link;

var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
        <Route name="login" path="login" handler={Login}/>
        <Route name="logout" path="logout" handler={Logout}/>
        <Route name="about" path="about" handler={About}/>
        <Route name="dashboard" path="dashboard" handler={Dashboard}/>
      </Routes>
    );
  }
});

var App = React.createClass({

  getInitialState: function() {
    return {
      loggedIn: auth.loggedIn()
    };
  },

  setStateOnAuth: function(loggedIn) {
    this.setState({
      loggedIn: loggedIn
    });
  },

  componentDidMount: function() {
    auth.onChange = this.setStateOnAuth.bind(this);
    auth.login();
  },

  render: function() {
    // spans on logout because VD doesn't seem to think anything changed otherwise?
    // probably a bug in Link
    var loginOrOut = this.state.loggedIn ?
      <span><Link to="logout">Log out</Link></span> :
      <Link to="login">Sign in</Link>;
    return (
      <div>
        <h1>Auth User Flow</h1>
        <div>{loginOrOut}</div>
        <ul>
          <li><Link to="about">About</Link></li>
          <li><Link to="dashboard">Dashboard</Link> (authenticated)</li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var AuthenticatedRoute = {
  statics: {
    lastInfo: null
  },

  componentDidMount: function() {
    if (!auth.loggedIn()) {
      AuthenticatedRoute.lastInfo = rf.router.getCurrentInfo();
      rf.router.replaceWith('login');
    }
  }
};

var Dashboard = React.createClass({

  mixins: [AuthenticatedRoute],

  render: function() {
    var token = auth.getToken();
    return (
      <div>
        <h1>Dashboard</h1>
        <p>You made it!</p>
        <p>{token}</p>
      </div>
    );
  }
});

var Login = React.createClass({
  getInitialState: function() {
    return {
      error: false
    };
  },

  handleSubmit: function(event) {
    event.preventDefault();
    var email = this.refs.email.getDOMNode().value;
    var pass = this.refs.pass.getDOMNode().value;
    auth.login(email, pass, function(loggedIn) {
      if (!loggedIn) {
        return this.setState({ error: true });
      }
      var lastInfo = AuthenticatedRoute.lastInfo;
      if (lastInfo) {
        return rf.router.replaceWith(lastInfo.name, lastInfo.params);
      }
      rf.router.replaceWith('about');
    }.bind(this));
  },

  render: function() {
    var errors = this.state.error ? <p>Bad login information</p> : '';
    return (
      <form onSubmit={this.handleSubmit}>
        <label><input ref="email" placeholder="email" defaultValue="joe@example.com"/></label> 
        <label><input ref="pass" placeholder="password"/></label> (hint: password1)<br/>
        <button type="submit">login</button>
        {errors}
      </form>
    );
  }
});

var About = React.createClass({
  render: function() {
    return <h1>About</h1>;
  }
});

var Logout = React.createClass({
  componentDidMount: function() {
    auth.logout();
  },

  render: function() {
    return <h1>You are now logged out</h1>;
  }
});


// Fake authentication lib

var auth = {
  login: function(email, pass, cb) {
    var cb = arguments[arguments.length - 1];
    if (localStorage.token) {
      cb && cb(true);
      this.onChange(true);
      return;
    }
    pretendRequest(email, pass, function(res) {
      if (res.authenticated) {
        localStorage.token = res.token;
        cb && cb(true);
        this.onChange(true);
      } else {
        cb && cb(false);
        this.onChange(false);
      }
    }.bind(this));
  },

  getToken: function() {
    return localStorage.token;
  },

  logout: function(cb) {
    delete localStorage.token;
    cb && cb();
    this.onChange(false);
  },

  loggedIn: function() {
    return !!localStorage.token;
  },

  onChange: function() {}
};


function pretendRequest(email, pass, cb) {
  setTimeout(function() {
    if (email === 'joe@example.com' && pass === 'password1') {
      cb({
        authenticated: true,
        token: Math.random().toString(36).substring(7),
      });
    } else {
      cb({authenticated: false});
    }
  }, 0);
}

React.renderComponent(<Main/>, document.body);

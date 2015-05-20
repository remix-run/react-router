var React = require('react');
var HashHistory = require('react-router/HashHistory');
var { createRouter, Route, Link } = require('react-router');

class App extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      loggedIn: auth.loggedIn()
    };
  }

  setStateOnAuth (loggedIn) {
    this.setState({
      loggedIn: loggedIn
    });
  }

  componentWillMount () {
    auth.onChange = this.setStateOnAuth.bind(this);
    auth.login();
  }

  render () {
    return (
      <div>
        <ul>
          <li>
            {this.state.loggedIn ? (
              <Link to="logout">Log out</Link>
            ) : (
              <Link to="login">Sign in</Link>
            )}
          </li>
          <li><Link to="about">About</Link></li>
          <li><Link to="dashboard">Dashboard</Link> (authenticated)</li>
        </ul>
        {this.props.children}
      </div>
    );
  }
}

function requireAuth (router, state) {
  if (!auth.loggedIn())
    router.replaceWith('/login', {}, {'nextPath' : state.location.path});
}

class Dashboard extends React.Component {
  render () {
    var token = auth.getToken();
    return (
      <div>
        <h1>Dashboard</h1>
        <p>You made it!</p>
        <p>{token}</p>
      </div>
    );
  }
}

class Login extends React.Component {

  constructor (props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.state = {
      error: false
    };
  }

  handleSubmit (event) {
    event.preventDefault();
    var { router } = this.context;
    var nextPath = router.getCurrentQuery().nextPath;
    var email = this.refs.email.getDOMNode().value;
    var pass = this.refs.pass.getDOMNode().value;
    auth.login(email, pass, (loggedIn) => {
      if (!loggedIn)
        return this.setState({ error: true });
      if (nextPath) {
        router.replaceWith(nextPath);
      } else {
        router.replaceWith('/about');
      }
    });
  }

  render () {
    return (
      <form onSubmit={this.handleSubmit}>
        <label><input ref="email" placeholder="email" defaultValue="joe@example.com"/></label>
        <label><input ref="pass" placeholder="password"/></label> (hint: password1)<br/>
        <button type="submit">login</button>
        {this.state.error && (
          <p>Bad login information</p>
        )}
      </form>
    );
  }
}

Login.contextTypes = {
  router: React.PropTypes.func
};

class About extends React.Component {
  render () {
    return <h1>About</h1>;
  }
}

class Logout extends React.Component {
  componentDidMount () {
    auth.logout();
  }

  render () {
    return <p>You are now logged out</p>;
  }
}


// Fake authentication lib

var auth = {
  login (email, pass, cb) {
    cb = arguments[arguments.length - 1];
    if (localStorage.token) {
      if (cb) cb(true);
      this.onChange(true);
      return;
    }
    pretendRequest(email, pass, (res) => {
      if (res.authenticated) {
        localStorage.token = res.token;
        if (cb) cb(true);
        this.onChange(true);
      } else {
        if (cb) cb(false);
        this.onChange(false);
      }
    });
  },

  getToken: function () {
    return localStorage.token;
  },

  logout: function (cb) {
    delete localStorage.token;
    if (cb) cb();
    this.onChange(false);
  },

  loggedIn: function () {
    return !!localStorage.token;
  },

  onChange: function () {}
};

function pretendRequest(email, pass, cb) {
  setTimeout(() => {
    if (email === 'joe@example.com' && pass === 'password1') {
      cb({
        authenticated: true,
        token: Math.random().toString(36).substring(7)
      });
    } else {
      cb({authenticated: false});
    }
  }, 0);
}

var routes = (
  <Route component={App}>
    <Route name="login" component={Login}/>
    <Route name="logout" component={Logout}/>
    <Route name="about" component={About}/>
    <Route name="dashboard" component={Dashboard} onEnter={requireAuth}/>
  </Route>
);

var Router = createRouter(routes);

React.render(<Router history={HashHistory}/>, document.getElementById('example'));

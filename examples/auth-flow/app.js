import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
import { Router, Route, Link, Navigation } from 'react-router';
import auth from './auth';

var App = React.createClass({
  getInitialState() {
    return {
      loggedIn: auth.loggedIn()
    };
  },

  setStateOnAuth(loggedIn) {
    this.setState({
      loggedIn: loggedIn
    });
  },

  componentWillMount() {
    auth.onChange = this.setStateOnAuth;
    auth.login();
  },

  render() {
    return (
      <div>
        <ul>
          <li>
            {this.state.loggedIn ? (
              <Link to="/logout">Log out</Link>
            ) : (
              <Link to="/login">Sign in</Link>
            )}
          </li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/dashboard">Dashboard</Link> (authenticated)</li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var Dashboard = React.createClass({
  render() {
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

  mixins: [ Navigation ],

  getInitialState() {
    return {
      error: false
    };
  },

  handleSubmit(event) {
    event.preventDefault();

    var { nextPathname } = this.props.query;
    var email = this.refs.email.getDOMNode().value;
    var pass = this.refs.pass.getDOMNode().value;

    auth.login(email, pass, (loggedIn) => {
      if (!loggedIn)
        return this.setState({ error: true });

      if (nextPathname) {
        this.replaceWith(nextPathname);
      } else {
        this.replaceWith('/about');
      }
    });
  },

  render() {
    console.log(this.props.query);
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
});

var About = React.createClass({
  render() {
    return <h1>About</h1>;
  }
});

var Logout = React.createClass({
  componentDidMount() {
    auth.logout();
  },

  render() {
    return <p>You are now logged out</p>;
  }
});

function requireAuth(nextState, router) {
  if (!auth.loggedIn())
    router.replaceWith('/login', { nextPathname: nextState.location.pathname });
}

React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="login" component={Login}/>
      <Route path="logout" component={Logout}/>
      <Route path="about" component={About}/>
      <Route path="dashboard" component={Dashboard} onEnter={requireAuth}/>
    </Route>
  </Router>
), document.getElementById('example'));

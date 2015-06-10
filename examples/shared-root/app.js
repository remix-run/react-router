var React = require('react');
var { Router, Route, RouteHandler, Link, HashHistory } = require('react-router');

var App = React.createClass({
  render: function () {
    return (
      <div>
        <p>
          This illustrates how routes can share UI w/o sharing the url,
          when routes have no path, they never match themselves but their
          children can, allowing "/signin" and "/forgot-password" to both
          be render in the <code>SignedOut</code> component.
        </p>
        <ol>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/signin">Sign in</Link></li>
          <li><Link to="/forgot-password">Forgot Password</Link></li>
        </ol>
        {this.props.children}
      </div>
    );
  }
});

var SignedIn = React.createClass({
  render: function () {
    return (
      <div>
        <h2>Signed In</h2>
        {this.props.children}
      </div>
    );
  }
});

var Home = React.createClass({
  render: function () {
    return (
      <h3>Welcome home!</h3>
    );
  }
});

var SignedOut = React.createClass({
  render: function () {
    return (
      <div>
        <h2>Signed Out</h2>
        {this.props.children}
      </div>
    );
  }
});

var SignIn = React.createClass({
  render: function () {
    return (
      <h3>Please sign in.</h3>
    );
  }
});

var ForgotPassword = React.createClass({
  render: function () {
    return (
      <h3>Forgot your password?</h3>
    );
  }
});

React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route component={SignedOut}>
        <Route path="signin" component={SignIn}/>
        <Route path="forgot-password" component={ForgotPassword}/>
      </Route>
      <Route component={SignedIn}>
        <Route path="home" component={Home}/>
      </Route>
    </Route>
  </Router>
), document.getElementById('example'));


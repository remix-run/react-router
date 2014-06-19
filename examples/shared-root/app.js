/** @jsx React.DOM */
var React = require('react');
var ReactRouter = require('../../modules/main');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ol>
          <li><Link to="home">Home</Link></li>
          <li><Link to="signin">Sign in</Link></li>
          <li><Link to="forgot-password">Forgot Password</Link></li>
        </ol>
        {this.props.activeRoute}
      </div>
    );
  }
});

var SignedIn = React.createClass({
  render: function () {
    return (
      <div>
        <h2>Signed In</h2>
        {this.props.activeRoute}
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
        {this.props.activeRoute}
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

Router(
  <Route handler={App}>
    <Route handler={SignedOut}>
      <Route name="signin" handler={SignIn}/>
      <Route name="forgot-password" handler={ForgotPassword}/>
    </Route>
    <Route handler={SignedIn}>
      <Route name="home" handler={Home}/>
    </Route>
  </Route>
).renderComponent(document.body);

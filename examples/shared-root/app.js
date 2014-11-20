var React = require('react');
var Router = require('react-router');
var { Route, RouteHandler, Link } = Router;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ol>
          <li><Link to="home">Home</Link></li>
          <li><Link to="signin">Sign in</Link></li>
          <li><Link to="forgot-password">Forgot Password</Link></li>
        </ol>
        <RouteHandler/>
      </div>
    );
  }
});

var SignedIn = React.createClass({
  render: function () {
    return (
      <div>
        <h2>Signed In</h2>
        <RouteHandler/>
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
        <RouteHandler/>
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

var routes = (
  <Route handler={App}>
    <Route handler={SignedOut}>
      <Route name="signin" handler={SignIn}/>
      <Route name="forgot-password" handler={ForgotPassword}/>
    </Route>
    <Route handler={SignedIn}>
      <Route name="home" handler={Home}/>
    </Route>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});

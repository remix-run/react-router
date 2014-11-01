/** @jsx React.DOM */
// TODO: animations aren't happening, think we need to implement addHandlerKey somewhere
var React = require('react');
var TransitionGroup = require('react/lib/ReactCSSTransitionGroup');
var Router = require('react-router');
var { Route, Link, ActiveRouteHandler } = Router;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ul>
          <li><Link to="page1">Page 1</Link></li>
          <li><Link to="page2">Page 2</Link></li>
        </ul>
        <TransitionGroup component="div" transitionName="example">
          <ActiveRouteHandler key={Date.now()} />
        </TransitionGroup>
      </div>
    );
  }
});

var Page1 = React.createClass({
  render: function () {
    return (
      <div className="Image">
        <h1>Page 1</h1>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var Page2 = React.createClass({
  render: function () {
    return (
      <div className="Image">
        <h1>Page 2</h1>
        <p>Consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <Route name="page1" handler={Page1} addHandlerKey={true} />
    <Route name="page2" handler={Page2} addHandlerKey={true} />
  </Route>
);

var el = document.getElementById('example');
Router.run(routes, (Handler) => React.render(<Handler/>, el));


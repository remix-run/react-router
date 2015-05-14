var React = require('react/addons');
var { cloneWithProps, CSSTransitionGroup } = React.addons;
var { createRouter, Route, Link } = require('react-router');
var HashHistory = require('react-router/HashHistory');
//var HashHistory = require('react-router/lib/HashHistory'); <-- what you use from npm

var App = React.createClass({

  render: function () {
    var key = this.props.location.path;
    return (
      <div>
        <ul>
          <li><Link to="page1">Page 1</Link></li>
          <li><Link to="page2">Page 2</Link></li>
        </ul>
        <CSSTransitionGroup component="div" transitionName="example">
          {cloneWithProps(this.props.children || <div/>, { key: key })}
        </CSSTransitionGroup>
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

var Router = createRouter(
  <Route component={App}>
    <Route name="page1" component={Page1} />
    <Route name="page2" component={Page2} />
  </Route>
);

React.render(<Router history={HashHistory}/>, document.getElementById('example'));


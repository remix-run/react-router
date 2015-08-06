import React from 'react/addons';
import createHistory from 'history/lib/createHashHistory';
import { Router, Route, Link } from 'react-router';

var { CSSTransitionGroup } = React.addons;

var history = createHistory();

var App = React.createClass({
  render() {
    var key = this.props.location.pathname;

    return (
      <div>
        <ul>
          <li><Link to="/page1">Page 1</Link></li>
          <li><Link to="/page2">Page 2</Link></li>
        </ul>
        <CSSTransitionGroup component="div" transitionName="example">
          {React.cloneElement(this.props.children || <div/>, { key: key })}
        </CSSTransitionGroup>
      </div>
    );
  }
});

var Page1 = React.createClass({
  render() {
    return (
      <div className="Image">
        <h1>Page 1</h1>
        <p><Link to="/page1">A link to page 1 should be active</Link>. Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed <Link to="/page2">should be inactive</Link> do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

var Page2 = React.createClass({
  render() {
    return (
      <div className="Image">
        <h1>Page 2</h1>
        <p>Consectetur adipisicing elit, sed do <Link to="/page2">a link to page 2 should also be active</Link> eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>
    );
  }
});

React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="page1" component={Page1} />
      <Route path="page2" component={Page2} />
    </Route>
  </Router>
), document.getElementById('example'));

import React from 'react';
import createHistory from 'history/lib/createHashHistory';
import { Router, Route, Link, Redirect } from 'react-router';

var history = createHistory();

var App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to="/user/123">Bob</Link></li>
          <li><Link to="/user/abc">Sally</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var User = React.createClass({
  render() {
    var { userID } = this.props.params;

    return (
      <div className="User">
        <h1>User id: {userID}</h1>
        <ul>
          <li><Link to={`/user/${userID}/tasks/foo`}>foo task</Link></li>
          <li><Link to={`/user/${userID}/tasks/bar`}>bar task</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var Task = React.createClass({
  render() {
    var { userID, taskID } = this.props.params;

    return (
      <div className="Task">
        <h2>User ID: {userID}</h2>
        <h3>Task ID: {taskID}</h3>
      </div>
    );
  }
});

React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="user/:userID" component={User}>
        <Route path="tasks/:taskID" component={Task} />
        <Redirect from="todos/:taskID" to="/user/:userID/tasks/:taskID" />
      </Route>
    </Route>
  </Router>
), document.getElementById('example'));

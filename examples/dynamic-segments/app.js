import React from 'react';
import { Router, Route, Link } from 'react-router';

var App = React.createClass({
  render () {
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
  render () {
    var { userId } = this.props.params;
    return (
      <div className="User">
        <h1>User id: {userId}</h1>
        <ul>
          <li><Link to={`/user/${userId}/tasks/foo`}>foo task</Link></li>
          <li><Link to={`/user/${userId}/tasks/bar`}>bar task</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});


var Task = React.createClass({
  render () {
    var { userId, taskId } = this.props.params;
    return (
      <div className="Task">
        <h2>User id: {userId}</h2>
        <h3>Task id: {taskId}</h3>
      </div>
    );
  }
});

React.render((
  <Router>
    <Route path="/" component={App}>
      <Route path="user/:userId" component={User}>
        <Route path="tasks/:taskId" component={Task}/>
        {/*<Redirect from="todos/:taskId" to="task"/>*/}
      </Route>
    </Route>
  </Router>
), document.getElementById('example'));


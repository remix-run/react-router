var React = require('react');
var { createRouter, Route, Redirect, Link } = require('react-router');
var HashHistory = require('react-router/HashHistory');

var App = React.createClass({
  render () {
    return (
      <div>
        <ul>
          <li><Link to="user" params={{userId: "123"}}>Bob</Link></li>
          <li><Link to="user" params={{userId: "abc"}}>Sally</Link></li>
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
          <li><Link to="task" params={{userId: userId, taskId: "foo"}}>foo task</Link></li>
          <li><Link to="task" params={{userId: userId, taskId: "bar"}}>bar task</Link></li>
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

var Router = createRouter(
  <Route path="/" component={App}>
    <Route name="user" path="/user/:userId" component={User}>
      <Route name="task" path="tasks/:taskId" component={Task}/>
      {/*<Redirect from="todos/:taskId" to="task"/>*/}
    </Route>
  </Route>
);

React.render(<Router history={HashHistory} />, document.getElementById('example'));


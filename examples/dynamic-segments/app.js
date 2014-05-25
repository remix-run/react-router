/** @jsx React.DOM */
var Routes = ReactRouter.Routes;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
        <Route name="user" path="user/:userId" handler={User}>
          <Route name="task" path="user/:userId/tasks/:taskId" handler={Task}/>
        </Route>
      </Routes>
    );
  }
});

var App = React.createClass({

  render: function() {
    return (
      <div>
        <ul>
          <li><Link to="user" userId="123">Bob</Link></li>
          <li><Link to="user" userId="abc">Sally</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var User = React.createClass({
  render: function() {
    return (
      <div className="User">
        <h1>User id: {this.props.userId}</h1>
        <ul>
          <li><Link to="task" userId={this.props.userId} taskId="foo">foo task</Link></li>
          <li><Link to="task" userId={this.props.userId} taskId="bar">bar task</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var Task = React.createClass({
  render: function() {
    return (
      <div className="Task">
        <h2>User id: {this.props.userId}</h2>
        <h3>Task id: {this.props.taskId}</h3>
      </div>
    );
  }
});

React.renderComponent(<Main/>, document.body);


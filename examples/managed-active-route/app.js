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

  doSomething: function(id) {
    alert('do something with '+id);
  },

  render: function() {
    var content;
    if (this.props.ActiveRoute) {
      // controlling the ActiveRoute instance yourself is flexible, but
      // you also have to wire up the params and the child's active
      // route
      var ActiveRoute = this.props.ActiveRoute;
      var params = this.props.activeParams;
      var activeGrandchild = this.props.activeRoute.props.activeRoute;
      content = ActiveRoute({
        // wire up the userId param
        userId: params.userId,
        // wire up the activeRoute so that Task will get rendered in
        // User::render
        activeRoute: activeGrandchild
        // ahh, the flexibility you desire, pass in your own props
        onDoSomething: this.doSomething
      });
    }
    return (
      <div>
        <ul>
          <li><Link to="user" userId="123">Bob</Link></li>
          <li><Link to="user" userId="abc">Sally</Link></li>
        </ul>
        {content}
      </div>
    );
  }
});

var User = React.createClass({
  handleClick: function() {
    this.props.onDoSomething(this.props.id);
  },

  render: function() {
    // note that this.props.activeRoute is normally created for you, but
    // if the parent route takes over by using ActiveRoute, you have to
    // make sure to pass it in
    return (
      <div className="User">
        <h1>User id: {this.props.userId}</h1>
        <button onClick={this.handleClick}>do something</button>
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


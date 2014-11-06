/** @jsx React.DOM */
var React = require('react');
var Router = require('react-router');
var Route = Router.Route;
var Routes = Router.Routes;
var Link = Router.Link;
var ActiveRouteHandler = Router.ActiveRouteHandler;
var ActiveState = Router.ActiveState;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ul>
          <li><Link to="user" params={{userId: "123"}}>Bob</Link></li>
          <li><Link to="user" params={{userId: "123"}} query={{showAge: true}}>Bob With Query Params</Link></li>
          <li><Link to="user" params={{userId: "abc"}}>Sally</Link></li>
        </ul>
        <ActiveRouteHandler />
      </div>
    );
  }
});

var User = React.createClass({
  mixins: [ ActiveState ],

  render: function () {
    var age = this.getActiveQuery().showAge ? '33' : '';
    var userId = this.getActiveParams().userId;
    return (
      <div className="User">
        <h1>User id: {userId}</h1>
        {age}
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <Route name="user" path="user/:userId" handler={User}/>
  </Route>
);

Router.run(routes, function(Handler, state) {
  React.renderComponent(<Handler />, document.getElementById('example'));
});


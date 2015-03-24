var React = require('react');
var Router = require('react-router');
var { Route, RouteHandler, Link } = Router;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ul>
          <li><Link to="user" params={{userID: "123"}}>Bob</Link></li>
          <li><Link to="user" params={{userID: "123"}} query={{showAge: true}}>Bob With Query Params</Link></li>
          <li><Link to="user" params={{userID: "abc"}}>Sally</Link></li>
        </ul>
        <RouteHandler/>
      </div>
    );
  }
});

var User = React.createClass({

  contextTypes: {
    router: React.PropTypes.func
  },

  render: function () {
    var { router } = this.context;
    var age = router.getCurrentQuery().showAge ? '33' : '';
    var userID = router.getCurrentParams().userID;
    return (
      <div className="User">
        <h1>User id: {userID}</h1>
        {age}
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <Route name="user" path="user/:userID" handler={User}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});

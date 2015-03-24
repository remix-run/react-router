var React = require('react');
var Router = require('react-router');
var { Route, RouteHandler, Link } = Router;
var Rx = require('rx');

var App = React.createClass({
  render () {
    return (
      <div>
        <ul>
          <li><Link to="user" params={{userId: "123"}}>Bob</Link></li>
          <li><Link to="user" params={{userId: "abc"}}>Sally</Link></li>
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

  render () {
    var { userId } = this.context.router.getCurrentParams();
    return (
      <div className="User">
        <h1>User id: {userId}</h1>
      </div>
    );
  }
});

var routes = (
  <Route path="/" handler={App}>
    <Route name="user" path="/user/:userId" handler={User}/>
  </Route>
);

var source = Rx.Observable.fromEventPattern(function(h) {
  Router.run(routes, h);  
});

source.subscribe(function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});

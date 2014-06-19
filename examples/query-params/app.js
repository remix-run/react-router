/** @jsx React.DOM */
var React = require('react');
var ReactRouter = require('../../modules/main');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var App = React.createClass({
  render: function() {
    return (
      <div>
        <ul>
          <li><Link to="user" userId="123">Bob</Link></li>
          <li><Link to="user" userId="123" query={{showAge: true}}>Bob With Query Params</Link></li>
          <li><Link to="user" userId="abc">Sally</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

var User = React.createClass({
  render: function() {
    var age = this.props.query.showAge ? '33' : '';
    return (
      <div className="User">
        <h1>User id: {this.props.params.userId}</h1>
        {age}
      </div>
    );
  }
});

Router(
  <Route handler={App}>
    <Route name="user" path="user/:userId" handler={User}/>
  </Route>
).renderComponent(document.body);


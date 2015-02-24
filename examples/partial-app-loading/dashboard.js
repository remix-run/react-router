var React = require('react');
var Router = require('react-router');
var { RouteHandler, Link } = Router;

var Dashboard = React.createClass({

  render: function () {
    return (
      <div>
        <h1>Dashboard!</h1>
        <ul>
          <li><Link to="inbox">Inbox</Link></li>
        </ul>
        <RouteHandler/>
      </div>
    );
  }
});

module.exports = Dashboard;

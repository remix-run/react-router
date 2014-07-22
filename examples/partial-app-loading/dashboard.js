/** @jsx React.DOM */

var React = require('react');
var ReactRouter = require('../../modules/main');
var Link = ReactRouter.Link;

var Dashboard = React.createClass({

  render: function() {
    return (
      <div>
        <h1>Dashboard!</h1>
        <ul>
          <li><Link to="inbox">Inbox</Link></li>
        </ul>
        {this.props.activeRouteHandler()}
      </div>
    );
  }
});

module.exports = Dashboard;

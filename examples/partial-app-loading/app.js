/** @jsx React.DOM */
var React = require('react');
var ReactRouter = require('../../modules/main');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var AsyncJSXRoute = {
  routeCache: {},

  load: function() {
    if (this.routeCache[this.globalName]) {
      return;
    }

    require.ensure([], function() {
      this.routeCache[this.globalName] = require('./async-components/' + this.filePath);
      this.forceUpdate();
    }.bind(this));
  },

  componentDidMount: function() {
    setTimeout(this.load, 1000); // feel it good
  },

  render: function() {
    var fullRoute = this.routeCache[this.globalName];
    return fullRoute ? fullRoute(this.props) : this.preRender();
  }
};

var PreDashboard = React.createClass({
  mixins: [AsyncJSXRoute],
  filePath: 'dashboard.js',
  globalName: 'Dashboard',
  preRender: function() {
    return <div>Loading dashboard...</div>
  }
});

var PreInbox = React.createClass({
  mixins: [AsyncJSXRoute],
  filePath: 'inbox.js',
  globalName: 'Inbox',
  preRender: function() {
    return <div>Loading inbox...</div>
  }
});

var App = React.createClass({
  render: function() {
    return (
      <div>
        <h1>Partial App</h1>
        <ul>
          <li><Link to="dashboard">Dashboard</Link></li>
        </ul>
        {this.props.activeRoute}
      </div>
    );
  }
});

Router(
  <Route handler={App}>
    <Route name="dashboard" path="dashboard" handler={PreDashboard}>
      <Route name="inbox" path="dashboard/inbox" handler={PreInbox}/>
    </Route>
  </Route>
).renderComponent(document.body);


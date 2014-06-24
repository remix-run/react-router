/** @jsx React.DOM */
var React = require('react');
var Router = require('../../modules/main');
var Route = Router.Route;
var Link = Router.Link;

var AsyncReactComponent = {
  loadedComponent: null,

  load: function() {
    if (this.constructor.loadedComponent) {
      return;
    }

    this.bundle(function(component) {
      this.constructor.loadedComponent = component;
      this.forceUpdate();
    }.bind(this));
  },

  componentDidMount: function() {
    setTimeout(this.load, 1000); // feel it good
  },

  render: function() {
    var component = this.constructor.loadedComponent;
    return component ? component(this.props) : this.preRender();
  }
};

var PreDashboard = React.createClass({
  mixins: [AsyncReactComponent],
  bundle: require('bundle?lazy!./dashboard.js'),
  preRender: function() {
    return <div>Loading dashboard...</div>
  }
});

var PreInbox = React.createClass({
  mixins: [AsyncReactComponent],
  bundle: require('bundle?lazy!./inbox.js'),
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

var routes = (
  <Route handler={App}>
    <Route name="dashboard" path="dashboard" handler={PreDashboard}>
      <Route name="inbox" path="dashboard/inbox" handler={PreInbox}/>
    </Route>
  </Route>
);

React.renderComponent(routes, document.body);

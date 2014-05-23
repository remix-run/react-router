/** @jsx React.DOM */
var Routes = ReactRouter.Routes;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;

var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
        <Route name="dashboard" path="dashboard" handler={PreDashboard}>
          <Route name="inbox" path="dashboard/inbox" handler={PreInbox}/>
        </Route>
      </Routes>
    );
  }
});

var AsyncJSXRoute = {
  load: function() {
    if (window[this.globalName]) return;
    JSXTransformer.load(this.filePath, this.forceUpdate.bind(this));
  },

  componentDidMount: function() {
    setTimeout(this.load, 1000); // feel it good
  },

  render: function() {
    var fullRoute = window[this.globalName];
    return fullRoute ? fullRoute(this.props) : this.preRender();
  }
};

var PreDashboard = React.createClass({
  mixins: [AsyncJSXRoute],
  filePath: 'partial-app-dashboard.js',
  globalName: 'Dashboard',
  preRender: function() {
    return <div>Loading dashboard...</div>
  }
});

var PreInbox = React.createClass({
  mixins: [AsyncJSXRoute],
  filePath: 'partial-app-inbox.js',
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

React.renderComponent(<Main/>, document.body);


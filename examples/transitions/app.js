var React = require('react');
var Router = require('react-router');
var { Route, DefaultRoute, RouteHandler, Link } = Router;

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ul>
          <li><Link to="dashboard">Dashboard</Link></li>
          <li><Link to="form">Form</Link></li>
        </ul>
        <RouteHandler/>
      </div>
    );
  }
});

var Home = React.createClass({
  render: function () {
    return <h1>Home</h1>;
  }
});

var Dashboard = React.createClass({
  render: function () {
    return <h1>Dashboard</h1>;
  }
});

var Form = React.createClass({

  contextTypes: {
    router: React.PropTypes.func.isRequired
  },

  statics: {
    willTransitionFrom: function (transition, element) {
      if (element.refs.userInput.getDOMNode().value !== '') {
        if (!confirm('You have unsaved information, are you sure you want to leave this page?')) {
          transition.abort();
        }
      }
    }
  },

  handleSubmit: function (event) {
    event.preventDefault();
    this.refs.userInput.getDOMNode().value = '';
    this.context.router.transitionTo('/');
  },

  render: function () {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <p>Click the dashboard link with text in the input.</p>
          <input type="text" ref="userInput" defaultValue="ohai" />
          <button type="submit">Go</button>
        </form>
      </div>
    );
  }
});

var routes = (
  <Route handler={App}>
    <DefaultRoute handler={Home}/>
    <Route name="dashboard" handler={Dashboard}/>
    <Route name="form" handler={Form}/>
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.getElementById('example'));
});

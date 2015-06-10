var React = require('react');
var { Router, Route, Link, TransitionHook, HashHistory } = require('react-router');

var App = React.createClass({
  render: function () {
    return (
      <div>
        <ul>
          <li><Link to="/dashboard">Dashboard</Link></li>
          <li><Link to="/form">Form</Link></li>
        </ul>
        {this.props.children}
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

  mixins: [ TransitionHook ],

  routerWillLeave: function (router) {
    if (this.refs.userInput.getDOMNode().value !== '') {
      if (!confirm('You have unsaved information, are you sure you want to leave this page?')) {
        router.cancelTransition();
      }
    }
  },

  handleSubmit: function (event) {
    event.preventDefault();
    this.refs.userInput.getDOMNode().value = '';
    this.context.router.transitionTo('/');
  },

  render: function () {
    console.log('form render');
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

React.render((
  <Router history={HashHistory}>
    <Route path="/" component={App}>
      <Route path="dashboard" component={Dashboard}/>
      <Route path="form" component={Form}/>
    </Route>
  </Router>
), document.getElementById('example'));


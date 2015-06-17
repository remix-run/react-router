import React, { findDOMNode } from 'react';
import { Router, Route, Link, Navigation, TransitionHook } from 'react-router';
import HashHistory from 'react-router/lib/HashHistory';

var App = React.createClass({
  render() {
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
  render() {
    return <h1>Home</h1>;
  }
});

var Dashboard = React.createClass({
  render() {
    return <h1>Dashboard</h1>;
  }
});

var Form = React.createClass({
  mixins: [ Navigation, TransitionHook ],

  routerWillLeave(nextState, transition) {
    if (findDOMNode(this.refs.userInput).value !== '')
      if (!confirm('You have unsaved information, are you sure you want to leave this page?'))
        transition.abort();
  },

  handleSubmit(event) {
    event.preventDefault();
    findDOMNode(this.refs.userInput).value = '';
    this.transitionTo('/');
  },

  render() {
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
  <Router history={new HashHistory}>
    <Route path="/" component={App}>
      <Route path="dashboard" component={Dashboard}/>
      <Route path="form" component={Form}/>
    </Route>
  </Router>
), document.getElementById('example'));

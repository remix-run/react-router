import React from 'react';
import { Router, Route, IndexRoute, Link } from 'react-router';


var App = React.createClass({
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});

var Index = React.createClass({
  render () {
    return (
      <div>
        <h1>You should not see this.</h1>
        {this.props.children}
      </div>
    )
  }
});

var Child = React.createClass({
  render () {
    return (
      <div>
        <h2>Redirected to "/child"</h2>
        <Link to="/">Try going to "/"</Link>
      </div>
    )
  }
});

function redirectToChild(location, replaceWith) {
  replaceWith(null, '/child');
}

React.render((
  <Router>
    <Route path="/" component={App}>
      <IndexRoute component={Index} onEnter={redirectToChild}/>
      <Route path="/child" component={Child}/>
    </Route>
  </Router>
), document.getElementById('example'));


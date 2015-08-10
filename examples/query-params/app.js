import React from 'react';
import createHistory from 'history/lib/createHashHistory';
import { Router, Route, Link } from 'react-router';

var User = React.createClass({
  render() {
    var { query } = this.props.location;
    var age = query && query.showAge ? '33' : '';
    var { userID } = this.props.params;
    return (
      <div className="User">
        <h1>User id: {userID}</h1>
        {age}
      </div>
    );
  }
});

var App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to="/user/bob">Bob</Link></li>
          <li><Link to="/user/bob" query={{showAge: true}}>Bob With Query Params</Link></li>
          <li><Link to="/user/sally">Sally</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var history = createHistory();

React.render((
  <Router history={history}>
    <Route path="/" component={App}>
      <Route path="user/:userID" component={User} />
    </Route>
  </Router>
), document.getElementById('example'));

var React = require('react');
var HashHistory = require('react-router/HashHistory');
var { createRouter, State, Route, Link } = require('react-router');

var User = React.createClass({
  mixins: [ State ],
  render() {
    var query = this.getQuery();
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
          <li><Link to="user" params={{userID: "123"}}>Bob</Link></li>
          <li><Link to="user" params={{userID: "123"}} query={{showAge: true}}>Bob With Query Params</Link></li>
          <li><Link to="user" params={{userID: "abc"}}>Sally</Link></li>
        </ul>
        {this.props.children}
      </div>
    );
  }
});

var Router = createRouter(
  <Route component={App}>
    <Route name="user" path="user/:userID" component={User}/>
  </Route>
);

React.render(<Router history={HashHistory}/>, document.getElementById('example'));

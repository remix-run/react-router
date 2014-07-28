Guide: Overview
===============

```
var Routes = require('react-router').Routes;
var Route = require('react-router').Route;

React.renderComponent((
  <Routes>
    <Route handler={App}>
      <Route name="about" handler={About}/>
      <Route name="users" handler={Users}>
        <Route name="user" path="/user/:userId" handler={User}/>
      </Route>
    </Route>
  </Routes>
), document.body);
```

Or if JSX isn't your jam:

```js
React.renderComponent((
  Routes({}, 
    Route({handler: App},
      Route({name: "about", handler: About}),
      Route({name: "users", handler: Users},
        Route({name: "user", path: "/user/:userId", handler: User})
      )
    )
  )
), document.body);
```

- URLs will be matched to the deepest route, and then all the routes up
the hierarchy are activated and their "handlers" (normal React
components) will be rendered.

- Paths are assumed from names unless specified.

- Each handler will receive a `params` property containing the matched
parameters form the url, like `:userId`.

- Handlers also receive a `query` prop equal to a dictionary of the
current query params.

- Parent routes will receive a `activeRouteHandler` property. Its a function that
will render the active child route handler.

Here's the rest of the application:

```js
var Link = require('react-router').Link;

var App = React.createClass({
  render: function() {
    return (
      <div>
        <ul>
          <li><Link to="about">About</Link></li>
          <li><Link to="users">Users</Link></li>
          <li><Link to="user" userId="123">User 123</Link></li>
        </ul>
        <this.props.activeRouteHandler/>
      </div>
    );
  }
});

var About = React.createClass({
  render: function() {
    return <h2>About</h2>;
  }
});

var Users = React.createClass({
  render: function() {
    return (
      <div>
        <h2>Users</h2>
        <this.props.activeRouteHandler/>
      </div>
    );
  }
});

var User = React.createClass({
  render: function() {
    return <div>{this.props.params.userId}</div>
  }
});
```

To better understand what is happening with `activeRouteHandler` perhaps an
example without the router will help. Lets take the scenario where
`/users/2` has been matched. Your render method, without this router,
might look something like this:

```js
render: function() {
  var user = <User params={{userId: 2}}/>;
  var users = <Users activeRouteHandler={user}/>;
  return <App activeRouteHandler={users}/>;
}
```

Instead, the router manages this view hierarchy for you.



React Router
============

Ember.js nailed the router. This library is generally a translation of
the ember routing API for React. All praise be to Yehuda Katz, Tom Dale,
and the Ember community for nailing down such a beautiful interface. May
the web be unbroken regardless of your tools.

WIP
---

This is a huge work in progress. Don't use it yet.

Example
-------

```js
var Main = React.createClass({
  render: function() {
    return (
      <Routes handler={App}>
        <Route name="about" path="about" handler={About}/>
        <Route name="users" path="users" handler={Users}>
          <Route name="user" path="user/:userId" handler={User}/>
        </Route>
      </Routes>
    );
  }
});

var App = React.createClass({
  render: function() {
    return (
      <div className="App">
        <h1>App</h1>
        <ul>
          <li><Link to="about">About</Link></li>
          <li><Link to="users">Users</Link></li>
          <li><Link to="user" userId="123">User 123</Link></li>
        </ul>
        {this.props.activeRoute}
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
      <div className="Users">
        <h2>Users</h2>
        {this.props.activeRoute}
      </div>
    );
  }
});

var User = React.createClass({
  render: function() {
    return <div>{this.props.params.userId}</div>
  }
});

React.renderComponent(<Main/>, document.body);
```

Guide
-----

Check out the examples for now.

First run `$ webpack` to build the example files then open them up.

Benefits of This Approach
-------------------------

1. **Incredible screen-creation productivity** - There is only one
   use-case when a user visits a route: render something. Every user
   interface has layers (or nesting) whether its a simple navbar or
   multiple levels of master-detail. Coupling nested routes to these
   nested views gets rid of a ton of work for the developer to wire all
   of it together when the user switches routes. Adding new screens
   could not get faster.

2. **Immediate understanding of application structure** - When routes
   are declared in one place, developers can easily construct a mental
   image of the application. It's essentially a sitemap. There's not a
   better way to get so much information about your app this quickly.

3. **Code tractability** - When a developer gets a ticket to fix a bug
   at as specific url they simply 1) look at the route config, then 2)
   go find the handler for that route. Every entry point into your
   application is represented by these routes.

4. **URLs are your first thought, not an after-thought** - Seriously,
   don't break the web. Friends don't let friends route alone. With
   ReactRouter, you don't get UI on the page without configuring a url
   first. Fortunately, its wildly productive this way, too.


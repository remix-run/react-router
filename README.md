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

For a number of different uses of React Router, see the examples.

First run `$ webpack` to build the example files then open them up.


###Components
React Router makes three different types of React components available:
`Routes`, `Route`, and `Link`. `Routes` has one purpose: a wrapper for all
of the routes of the entire app. All `Route` paths will be nested within a single
`Routes` instance. A `Route`, despite its singular name, can have `Route` children
nested under it to an arbitrary depth.

####Routes
The `<Routes></Routes>` component wraps the list of route paths for an entire app.
All `Route` paths will be nested within the `Routes` container. The `Routes` component
takes two props:

  * `handler`: Required, React compoent. Points to a React component class (generally, whatever
  component acts as the full App wrapper), which will be rendered and be the parent of all `Route` views

  * `location`: String, one of `hash` (default) or `history`.  Determines whether the React Router
  should use location hashes (default) or the HTML5 History API.

The `handler` React component will receive a special addition to its props: `activeRoute`, which references
whatever view component should be active for the current URL, as specified in the `Routes` JSX structure.

####Route
The `<Route></Route>` compoent will specify each of the named URL routes in your app. Despite its
singular name, each `Route` can have more `Route` instances nested within them to arbitrary depths. Each
`Route` component takes the following props:

  * `handler`: Required, React component. Just as with the `Routes` component above, the `handler` prop points
  to the React component class of the view that will render for this Route path.

  * `path`: String. The URL path that will active this `Route`. Does not need to be proceeded by a slash. The
  path can accept placeholder params in its definition - e.g. `users/:userId` will create a new `userId` param
  for the `Route` that will accept any value.

  * `name`: String. A reference value for the route, to allow for easy lookup / linking via `Link` components.

The `handler` React component will receive a number of additions to its props:

  * `activeRoute`: React component instance. A reference to whatever view component should be active for the current URL,
  if this `Route` has nested values.

  * `params`: Object hash. A key/value of each of the param placeholders specified in the `Route`'s path.

  * `query`: Object hash. A key/value of each of the querystrings in the URL.

####Link
A `<Link></Link>` component allows for the easy creation of HTML `<a href>`s pointing to named paths
within the `<Routes>` tree. (Behind the scenes, each `Link` looks up values stored within a route store.)
`Link` componentsc can detect if they are referring to the currently active path; if they are, they will
append an `active` class to their class list.

A `Link` component takes the following props:

  * `to`: String. Looks up the path of a `Route` by its `name` prop.

  * `query`: Object. A key/value list of queryparams to append to the generated link.

  * `className`: String, defaults to ''. The class of the generated anchor component that will be rendered.

Note that **additional** props can be provided to the `Link` component as well. Each of these `props` will be used to fill
in variable `Route` params. For example, if a `Link` is pointing to a path that accepts a `:userId` param, the `Link` can
be specified like so: `<Link to="user" userId="123" />`

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


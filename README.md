React Router
============

[![Build Status](https://travis-ci.org/rpflorence/react-router.svg?branch=master)](https://travis-ci.org/rpflorence/react-router)

A complete routing library for React.

You are viewing docs for the latest code on master. Check out
[other releases](https://github.com/rpflorence/react-router/releases)
for the version you have installed.

Features
--------

- Nested views mapped to nested routes
- Modular construction of route hierarchy
- Fully asynchronous transition hooks
- Transition abort / redirect / retry
- Dynamic segments
- Query parameters
- Links with automatic `.active` class when their route is active
- Multiple root routes
- Hash or HTML5 history URLs

Check out the `examples` directory to see how simple previously complex UI
and workflows are to create.

Installation
------------

```sh
npm install react-nested-router
# or
bower install react-router
```

This library is written with CommonJS modules. If you are using
browserify, webpack, or similar, you can consume it like anything else
installed from npm.

There is also a UMD build available on bower, find the library on
`window.ReactRouter`.

Usage
-----

```
var Route = require('react-nested-router').Route;

React.renderComponent((
  <Route handler={App}>
    <Route name="about" handler={About}/>
    <Route name="users" handler={Users}>
      <Route name="user" path="/user/:userId" handler={User}/>
    </Route>
  </Route>
), document.body);
```

Or if JSX isn't your jam:

```js
React.renderComponent((
  Route({handler: App},
    Route({name: "about", handler: About}),
    Route({name: "users", handler: Users},
      Route({name: "user", path: "/user/:userId", handler: User})
    )
  )
), document.body);
```

- Urls will be matched to the deepest route, and then all the routes up
the hierarchy are activated and their "handlers" (normal React
components) will be rendered.

- Each handler will receive a `params` property containing the matched
parameters form the url, like `:userId`.

- Handlers also receive a `query` prop equal to a dictionary of the
current query params.

- Parent routes will receive a `activeRouteHandler` property. Its a function that
will render the active child route handler.

Here's the rest of the application:

```js
var Link = require('react-nested-router').Link;

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
  var users = <User activeRouteHandler={user}/>;
  return <App activeRouteHandler={users}/>;
}
```

Instead, the router manages this view hierarchy for you.

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

4. **URLs are your first thought, not an after-thought** - With React
   Nested Router, you don't get UI on the page without configuring a url
   first. Fortunately, its wildly productive this way, too.

Related Modules
---------------

- https://github.com/bjyoungblood/rnr-constrained-route - validate paths
  and parameters on route handlers.

API
---

### Route (component)

Configuration component to declare your application's routes and view hierarchy.

#### Props

**location** - The method to use for page navigation when initializing the router.
May be either "hash" to use URLs with hashes in them and the `hashchange` event or
"history" to use the HTML5 history API. This prop is only ever used on the root
route that is rendered into the page. The default is "hash".

**name** - The name of the route, used in the `Link` component and the
router's transition methods.

**path** - The path used in the URL, supporting dynamic segments. If
left undefined, the path will be defined by the `name`. This path is always
absolute from the URL "root", even if the leading slash is left off. Nested
routes do not inherit the path of their parent.

**handler** - The component to be rendered when the route matches.

#### Children

Routes can be nested. When a child route matches, the parent route's
handler will have an instance of the child route's handler available as
`this.props.activeRouteHandler()`. You can then render it in the parent
passing in any additional props as needed.

#### Examples

```xml
<Route handler={App}>
  <!-- path is automatically assigned to the name since it is omitted -->
  <Route name="about" handler={About}/>
  <Route name="users" handler={Users}>
    <!-- note the dynamic segment in the path -->
    <Route name="user" handler={User} path="/user/:id"/>
  </Route>
</Route>
```

Or w/o JSX:

```js
Route({handler: App},
  Route({name: 'about', handler: About}),
  Route({name: 'users', handler: Users},
    Route({name: 'user', handler: User, path: '/user/:id'})
  )
);
```

### Route Handler (user-defined component)

The value you pass to a route's `handler` prop is another component that
is rendered to the page when that route is active. There are some special
props and static methods available to these components.

#### Props

**this.props.activeRouteHandler(extraProps)** - The active child route handler.
Use it in your render method to render the child route, passing in
additional properties as needed.

**this.props.params** - When a route has dynamic segments like `<Route
path="users/:userId"/>` the dynamic values are available at
`this.props.params.userId`, etc.

**this.props.query** - The query parameters from the url.

#### Static Methods (Transition Hooks)

You can define static methods on your route handlers that will be called
during route transitions.

**willTransitionTo(transition, params)** - Called when a route is about
to render, giving you the opportunity to abort the transition. You can
return a promise and the whole route hierarchy will wait for the
promises to resolve before proceeding. This is especially useful for
server-side rendering when you need to populate some data before the
handler is rendered.

**willTransitionFrom(transition, component)** - Called when an active
route is being transitioned out giving you an opportunity to abort the
transition. The `component` is the current component, you'll probably
need it to check its state to decide if you want to allow the
transition.

### Transition (object)

**transition.abort()** - aborts a transition

**transition.redirect(to, params, query)** - redirect to another route

**transition.retry()** - retrys a transition

#### Example

```js
var Settings = React.createClass({
  statics: {
    willTransitionTo: function(transition, params) {
      return auth.isLoggedIn().then(function(loggedIn) {
        if (!loggedIn)
          return;
        transition.abort();
        return auth.logIn({transition: transition});
        // in auth module call `transition.retry()` after being logged in
      });
    },

    willTransitionFrom: function(transition, component) {
      if (component.formHasUnsavedData())) {
        if (!confirm('You have unsaved information, are you sure you want to leave this page?')) {
          transition.abort();
        }
      }
    }
  }

  //...
});
```

### Link (Component)

Creates an anchor tag that links to a route in the application. Also
gets the `active` class automatically when the route matches. If you
change the path of your route, you don't have to change your links.

#### Properties

**to** - The name of the route to link to, or a full URL.

**query** - Object, Query parameters to add to the link. Access query
parameters in your route handler with `this.props.query`.

**[param]** - Any parameters the route defines are passed by name
through the link's properties.

#### Example

Given a route like `<Route name="user" path="/users/:userId"/>`:

```xml
<Link to="user" userId={user.id} params={{foo: bar}}>{user.name}</Link>
<!-- becomes one of these depending on your router and if the route is
active -->
<a href="/users/123?foo=bar" class="active">Michael</a>
<a href="#/users/123?foo=bar">Michael</a>

<!-- or if you have the full url already, you can just pass that in -->
<Link to="/users/123?foo=bar"/>
```


### Top-Level Static Methods

The router has several top-level methods that may be used to navigate around the application.

```js
var Router = require('react-nested-router')
```

**transitionTo(routeNameOrPath, [params[, query]])** - Programatically transition to a new route.

```js
Router.transitionTo('user', {id: 10}, {showAge: true});
Router.transitionTo('about');
Router.transitionTo('/users/10?showAge=true');
```

**replaceWith(routeName, [params[, query]])** - Programatically replace current route with a new route. Does not add an entry into the browser history.

```js
Router.replaceWith('user', {id: 10}, {showAge: true});
Router.replaceWith('about');
Router.replaceWith('/users/10?showAge=true');
```

**goBack()** - Programatically go back to the last route and remove the most recent entry from the browser history.

```js
Router.goBack();
```

Development
-----------

Please see [CONTRIBUTING](CONTRIBUTING.md)

Thanks, Ember
-------------

This library is highly inspired by the Ember.js routing API. In general,
its a translation of the Ember router api to React. Huge thanks to the
Ember team for solving the hardest part already.


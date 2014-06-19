React Nested Router
===================

[![Build Status](https://travis-ci.org/rpflorence/react-nested-router.svg?branch=master)](https://travis-ci.org/rpflorence/react-nested-router)

A complete routing library for React.

Features
--------

- Nested views mapped to nested routes
- Dynamic segments
- Query parameters
- Links with automatic `.active` class when their route is active
- Transition abort / retry
- Multiple root routes
- hash or history urls

Check out the examples directory to see how simple previously complex UI
and workflows are to create.

Installation
------------

`npm install react-nested-router`

Usage
-----

This library only ships with common js modules, so you'll need browserify or
webpack or something that can load/bundle it.

```
var Router = require('react-router');
var Route = Router.Route;
var Link = Router.Link;

Router(
  <Route handler={App}>
    <Route name="about" handler={About}/>
    <Route name="users" handler={Users}>
      <Route name="user" path="user/:userId" handler={User}/>
    </Route>
  </Route>
).renderComponent(document.body);
```

Or if JSX isn't your jam:

```js
Router(
  Route({handler: App},
    Route({name: "about", handler: About}),
    Route({name: "users", handler: Users},
      Route({name="user", path: "user/:userId", handler: User})
    )
  )
).renderComponent(document.body);
```

When a `Route` is active, you'll get an instance of `handler`
automatically rendered for you. When one of the child routes is active,
you can render it with `this.props.activeRoute` in the parent all the
way down the view hierarchy. This allows you to create nested layouts
without having to wire it all up yourself. `Link` components create
accessible anchor tags to route you around the application.

Here's the rest of the application:

```js
var App = React.createClass({
  render: function() {
    return (
      <div>
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
      <div>
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
```

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

API
---

### Router (Constructor)

Router config constructor.

```jsx
Router(
  <Route handler={App}>
    <Route path="/users" name="userList" handler={UserList}>
      <Route path="/users/:id" name="user" handler={User}/>
    </Route>
  </Route>
);
```

#### Methods

**renderComponent(Node)** - Renders the top level handler into `Node`.

```js
var router = Router(routes);
router.renderComponent(document.body):
```

#### Constructor Methods

**useHistory()** - Uses the browser's history API instead of hashes.

```js
Router.useHistory();
```

**transitionTo(routeName, [params[, query]])** - Programatically transition to a new route.

```js
Router.transitionTo('user', {id: 10}, {showAge: true});
Router.transitionTo('about');
```

**replaceWith(routeName, [params[, query]])** - Programatically replace current route with a new route. Does not add an entry into the browser history.

```js
Router.replaceWith('user', {id: 10}, {showAge: true});
Router.replaceWith('about');
```

### Route (Component)

Configuration component to declare your application's routes and view hierarchy.

#### Properties

**name** - The name of the route, used in the `Link` component and the
router's transition methods.

**path** - The path used in the URL, supporting dynamic segments. If
left undefined, the path will be defined by the `name`.

**handler** - The component to be rendered when the route matches.

#### Children

Routes can be nested. When a child route matches, the parent route's
handler will have an instance of the child route's handler available on
`this.props.activeRoute`.

#### Examples

```xml
<Route handler={App}>
  <!-- path is automatically assigned to the name since it is omitted -->
  <Route name="about" handler={About} />
  <Route name="users" handler={Users}>
    <!-- note the dynamic segment in the path -->
    <Route name="user" handler={User} path="/user/:id" />
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

#### Note

Paths are not inherited from parent routes.

### Handlers

There are some properties and hooks available to the handlers you pass
to the `handler` property of a `Route`.

#### Properties

**this.props.activeRoute** - The active child route handler instance.
Use it in your render method to render the child route.

**this.props.params** - When a route has dynamic segments like `<Route
path="users/:userId"/>` the dynamic values are available at
`this.props.params.userId`, etc.

**this.props.query** - The query parameters from the url.

### Transition Hooks

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

#### transition (object)

**transition.abort()** - aborts a transition

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

**to** - The name of the route to link to.

**[param]** - Any parameters the route defines are passed by name
through the link's properties.

#### Example

Given a route like `<Route name="user" path="/users/:userId"/>`:

```xml
<Link to="user" userId={user.id}>{user.name}</Link>
<!-- becomes one of these depending on your router and if the route is
active -->
<a href="/users/123" class="active">Michael</a>
<a href="#/users/123">Michael</a>
```

Development
-----------

- `script/test` will fire up a karma runner and watch for changes in the
  specs directory.
- `npm test` will do the same but doesn't watch, just runs the tests.
- `script/build-examples` does exactly that.

Thanks, Ember
-------------

This library is highly inspired by the Ember.js routing API. In general,
its a translation of the Ember router api to React. Huge thanks to the
Ember team for solving the hardest part already.


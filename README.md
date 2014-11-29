[![npm package](https://img.shields.io/npm/v/react-router.svg?style=flat-square)](https://www.npmjs.org/package/react-router)
[![build status](https://img.shields.io/travis/rackt/react-router.svg?style=flat-square)](https://travis-ci.org/rackt/react-router)
[![dependency status](https://img.shields.io/david/rackt/react-router.svg?style=flat-square)](https://david-dm.org/rackt/react-router)

React Router
============

A complete routing library for React.

Docs
----

- [Guide: Overview](/docs/guides/overview.md)
- [API](/docs/api/)

Important Notes
---------------

### SemVer

Before our `1.0` release, breaking API changes will cause a bump to
`0.x`. For example, `0.4.1` and `0.4.8` will have the same API, but
`0.5.0` will have breaking changes.

Please refer to the [upgrade guide](/UPGRADE_GUIDE.md) and
[changelog](/CHANGELOG.md) when upgrading.

Installation
------------

```sh
npm install react-router
# or
bower install react-router
```

This library is written with CommonJS modules. If you are using
browserify, webpack, or similar, you can consume it like anything else
installed from npm.

There is also a global build available on bower, find the library on
`window.ReactRouter`.

Features
--------

- Nested views mapped to nested routes
- Modular construction of route hierarchy
- Sync and async transition hooks
- Transition abort / redirect / retry
- Dynamic segments
- Query parameters
- Links with automatic `.active` class when their route is active
- Multiple root routes
- Hash or HTML5 history (with fallback) URLs
- Declarative Redirect routes
- Declarative NotFound routes
- Browser scroll behavior with transitions

Check out the `examples` directory to see how simple previously complex UI
and workflows are to create.

What's it look like?
--------------------

```js
var routes = (
  <Route handler={App} path="/">
    <DefaultRoute handler={Home} />
    <Route name="about" handler={About} />
    <Route name="users" handler={Users}>
      <Route name="recent-users" path="recent" handler={RecentUsers} />
      <Route name="user" path="/user/:userId" handler={User} />
      <NotFoundRoute handler={UserRouteNotFound}/>
    </Route>
    <NotFoundRoute handler={NotFound}/>
    <Redirect from="company" to="about" />
  </Route>
);

Router.run(routes, function (Handler) {
  React.render(<Handler/>, document.body);
});

// Or, if you'd like to use the HTML5 history API for cleaner URLs:

Router.run(routes, Router.HistoryLocation, function (Handler) {
  React.render(<Handler/>, document.body);
});
```

See more in the [overview guide](/docs/guides/overview.md).

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
   Router, you don't get UI on the page without configuring a url first.
   Fortunately, its wildly productive this way, too.

Related Modules
---------------

- [rnr-constrained-route](https://github.com/bjyoungblood/rnr-constrained-route) - validate paths
  and parameters on route handlers.
- [react-router-bootstrap](https://github.com/mtscout6/react-router-bootstrap) - Integration with [react-bootstrap](https://github.com/react-bootstrap/react-bootstrap) components.

Contributing
------------

Please see [CONTRIBUTING](CONTRIBUTING.md)

Thanks, Ember
-------------

This library is highly inspired by the Ember.js routing API. In general,
its a translation of the Ember router api to React. Huge thanks to the
Ember team for solving the hardest part already.


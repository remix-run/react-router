[![build status](https://img.shields.io/travis/rackt/react-router/master.svg?style=flat-square)](https://travis-ci.org/rackt/react-router)
[![npm package](https://img.shields.io/npm/v/react-router.svg?style=flat-square)](https://www.npmjs.org/package/react-router)
[![react-router channel on slack](https://img.shields.io/badge/slack-react--router@reactiflux-61DAFB.svg?style=flat-square)](http://www.reactiflux.com)

<img src="https://rackt.github.io/react-router/img/vertical.png" width="300"/>

A complete routing library for React. https://rackt.github.io/react-router

React Router keeps your UI in sync with the URL. It has a simple API
with powerful features like lazy code loading, dynamic route matching,
and location transition handling built right in. Make the URL your first
thought, not an after-thought.

Docs & Help
-----------

- [Guides and API Docs](https://rackt.github.io/react-router)
- [Upgrade Guide](/UPGRADE_GUIDE.md)
- [Changelog](/CHANGELOG.md)
- [#react-router channel on reactiflux](http://www.reactiflux.com/)

**Note: the docs and the examples in master refer to the 1.0 Beta and may be incomplete.**  
**Browse [the website](http://rackt.github.io/react-router/) and [the 0.13.3 tag](https://github.com/rackt/react-router/tree/v0.13.3) for the information about the latest stable version.**

Browser Support
---------------

We support all browsers and environments where React runs.

Installation
------------

### npm + webpack/browserify

```sh
npm install react-router
```

Then with a module bundler or webpack, use as you would anything else:

```js
// using an ES6 transpiler
import { Router, Route, Link } from 'react-router';

// not using an ES6 transpiler
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var Link = ReactRouter.Link;
```

There's also a `lib/umd` folder containing a UMD version.

### bower + who knows what

```sh
bower install react-router
```

Find the UMD/global build in `lib/umd`, and the library on
`window.ReactRouter`. Best of luck to you. :)

### CDN

Available on cdnjs [here](https://cdnjs.com/libraries/react-router).

What's it look like?
--------------------

```js
var Router = require('react-router');
var Route = Router.Route;
var Link = Router.Link;

// components to route between
var About = React.createClass({
  render: function () {
    return <h2>About</h2>;
  }
});

var Inbox = React.createClass({
  render: function () {
    return <h2>Inbox</h2>;
  }
});

// declare our routes and their hierarchy
var routes = (
  <Route handler={App}>
    <Route name="about" handler={About}/>
    <Route name="inbox" handler={Inbox}/>
  </Route>
);

var Navbar = React.createClass({
  render: function(){
    return (
      <div>
        // use Link to route around App
        <Link to="about">About</Link>
        <Link to="inbox">Inbox</Link>
      </div>
    )
  }
});

var RouteHandler = Router.RouteHandler;

var App = React.createClass({
  render () {
    return (
      <div>
        <Navbar/>
        <h1>App</h1>
        <RouteHandler/>
      </div>
    )
  }
});

// listens to URL and renders components to RouteHandler
Router.run(routes, Router.HashLocation, (Root) => {
  React.render(<Root/>, document.body);
});

```

See more in the [overview guide](/doc/00 Guides/0 Overview.md) and [Advanced
Usage](/doc/00 Guides/Advanced Usage.md)

Contributing
------------

Please see [CONTRIBUTING](CONTRIBUTING.md)

Thanks, Ember
-------------

React Router was initially inspired by Ember's fantastic Router. Many
thanks to the Ember team.

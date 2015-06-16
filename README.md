[![npm package](https://img.shields.io/npm/v/react-router.svg?style=flat-square)](https://www.npmjs.org/package/react-router)
[![build status](https://img.shields.io/travis/rackt/react-router/master.svg?style=flat-square)](https://travis-ci.org/rackt/react-router)
[![dependency status](https://img.shields.io/david/rackt/react-router.svg?style=flat-square)](https://david-dm.org/rackt/react-router)
[![Gitter](https://img.shields.io/badge/GITTER-join%20chat-1DCF73.svg?style=flat-square)](https://gitter.im/rackt/react-router?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

<img src="https://rackt.github.io/react-router/img/vertical.png" width="300"/>

A complete routing library for React. https://rackt.github.io/react-router

React Router keeps the URL in sync with nested UI. It has a simple API
with powerful features like lazy code loading, dynamic route matching,
and location transition handling built right in. Make the URL your first
thought, not an after-thought.

Docs
----

- [Guides and API Docs](https://rackt.github.io/react-router)
- [Upgrade Guide](/UPGRADE_GUIDE.md)
- [Changelog](/CHANGELOG.md)

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
```

There's also a `dist/` folder containing a UMD version.

### bower + who knows what

```sh
bower install react-router
```

Find the UMD/global build in `dist/`, and the library on
`window.ReactRouter`. Best of luck to you.

### CDN

Available on cdnjs [here](https://cdnjs.com/libraries/react-router).

What's it look like?
--------------------

```js
import { Router, Route } from 'react-router';
import BrowserHistory from 'react-router/lib/BrowserHistory';

var App = React.createClass({/*...*/});
var About = React.createClass({/*...*/});
// etc.

var Users = React.createClass({
  render() {
    return (
      <div>
        <h1>Users</h1>
        <div className="master">
          <ul>
            {/* use Link to route around the app */}
            {this.state.users.map(user => (
              <li><Link to={`/users/${users.id}`}>{user.name}</Link></li>
            ))}
          </ul>
        </div>
        <div className="detail">
          {this.props.children}
        </div>
      </div>
    );
  }
});

var User = React.createClass({
  componentDidMount() {
    this.setState({
      // route components are rendered with useful information, like URL params
      user: findUserById(this.props.params.userId)
    });
  },

  render() {
    return (
      <div>
        <h2>{this.state.user.name}</h2>
        {/* etc. */}
      </div>
    );
  }
});

// Declarative route configuration (could also load this config lazily
// instead, all you really need is a single root route, you don't need to
// colocate the entire config).
React.render((
  <Router history={BrowserHistory}>
    <Route path="/" component={App}>
      <Route path="about" component={About}/>
      <Route path="users" component={Users} indexComponent={RecentUsers}>
        <Route path="/user/:userId" component={User}/>
      </Route>
      <Route path="*" component={NoMatch}/>
    </Route>
  </Router>
), document.body);
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

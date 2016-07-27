# React Router [![Travis][build-badge]][build] [![npm package][npm-badge]][npm]

<img src="/logo/vertical@2x.png" height="150"/>

React Router is a complete routing library for [React](https://facebook.github.io/react).

React Router keeps your UI in sync with the URL. It has a simple API with powerful features like lazy code loading, dynamic route matching, and location transition handling built right in. Make the URL your first thought, not an after-thought.

[![Coveralls][coveralls-badge]][coveralls]
[![Discord][discord-badge]][discord]

> **Important:** *This is the `next` branch of React Router and may contain changes that are not yet released. To see the code for stable releases, browse [the `master` branch](https://github.com/reactjs/react-router/tree/master).*

### Docs & Help

- [Tutorial – do this first!](https://github.com/reactjs/react-router-tutorial)
- [Guides and API docs](/docs)
- [Troubleshooting guide](https://github.com/reactjs/react-router/blob/master/docs/Troubleshooting.md)
- [Changelog](/CHANGES.md)
- [Stack Overflow](http://stackoverflow.com/questions/tagged/react-router)
- [CodePen boilerplate](http://codepen.io/anon/pen/xwQZdy?editors=001) for bug reports

**Older Versions:**

- 0.13.x - [docs](https://github.com/reactjs/react-router/tree/v0.13.6/doc) / [guides](https://github.com/reactjs/react-router/tree/v0.13.6/docs/guides) / [code](https://github.com/reactjs/react-router/tree/v0.13.6) / [upgrade guide](https://github.com/reactjs/react-router/blob/master/upgrade-guides/v1.0.0.md)
- 1.0.x - [docs](https://github.com/reactjs/react-router/tree/1.0.x/docs) / [code](https://github.com/reactjs/react-router/tree/1.0.x) / [upgrade guide](https://github.com/reactjs/react-router/blob/master/upgrade-guides/v2.0.0.md)

For questions and support, please visit [our channel on Reactiflux](https://discord.gg/0ZcbPKXt5bYaNQ46) or [Stack Overflow](http://stackoverflow.com/questions/tagged/react-router).

### Browser Support

We support all browsers and environments where React runs.

### Installation

Using [npm](https://www.npmjs.com/):

    $ npm install --save react-router

Then with a module bundler like [webpack](https://webpack.github.io/) that supports either CommonJS or ES2015 modules, use as you would anything else:

```js
// using an ES6 transpiler, like babel
import { Router, Route, Link } from 'react-router'

// not using an ES6 transpiler
var Router = require('react-router').Router
var Route = require('react-router').Route
var Link = require('react-router').Link
```

The UMD build is also available on [npmcdn](https://npmcdn.com):

```html
<script src="https://npmcdn.com/react-router/umd/ReactRouter.min.js"></script>
```

You can find the library on `window.ReactRouter`.

### What's it look like?

```js
import React from 'react'
import { render } from 'react-dom'
import { Router, Route, Link, browserHistory } from 'react-router'

const App = React.createClass({/*...*/})
const About = React.createClass({/*...*/})
const NoMatch = React.createClass({/*...*/})

const Users = React.createClass({
  render() {
    return (
      <div>
        <h1>Users</h1>
        <div className="master">
          <ul>
            {/* use Link to route around the app */}
            {this.state.users.map(user => (
              <li key={user.id}><Link to={`/user/${user.id}`}>{user.name}</Link></li>
            ))}
          </ul>
        </div>
        <div className="detail">
          {this.props.children}
        </div>
      </div>
    )
  }
})

const User = React.createClass({
  componentDidMount() {
    this.setState({
      // route components are rendered with useful information, like URL params
      user: findUserById(this.props.params.userId)
    })
  },

  render() {
    return (
      <div>
        <h2>{this.state.user.name}</h2>
        {/* etc. */}
      </div>
    )
  }
})

// Declarative route configuration (could also load this config lazily
// instead, all you really need is a single root route, you don't need to
// colocate the entire config).
render((
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <Route path="about" component={About}/>
      <Route path="users" component={Users}>
        <Route path="/user/:userId" component={User}/>
      </Route>
      <Route path="*" component={NoMatch}/>
    </Route>
  </Router>
), document.getElementById('root'))
```

See more in the [Introduction](/docs/Introduction.md), [Guides](/docs/guides/README.md), and [Examples](/examples).

### Versioning and Stability

We want React Router to be a stable dependency that’s easy to keep current. We follow the same versioning as React.js itself: [React Versioning Scheme](https://facebook.github.io/react/blog/2016/02/19/new-versioning-scheme.html).

### Thanks

Thanks to [our sponsors](/SPONSORS.md) for supporting the development of
React Router.

React Router was initially inspired by Ember's fantastic router. Many thanks to the Ember team.

Also, thanks to [BrowserStack](https://www.browserstack.com/) for providing the infrastructure that allows us to run our build in real browsers.

[build-badge]: https://img.shields.io/travis/reactjs/react-router/master.svg?style=flat-square
[build]: https://travis-ci.org/reactjs/react-router

[npm-badge]: https://img.shields.io/npm/v/react-router.svg?style=flat-square
[npm]: https://www.npmjs.org/package/react-router

[coveralls-badge]: https://img.shields.io/coveralls/reactjs/react-router/master.svg?style=flat-square
[coveralls]: https://coveralls.io/github/reactjs/react-router

[discord-badge]: https://img.shields.io/badge/Discord-join%20chat%20%E2%86%92-738bd7.svg?style=flat-square
[discord]: https://discord.gg/0ZcbPKXt5bYaNQ46

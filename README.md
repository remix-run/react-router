<h1 align="center">
  <img src='https://github.com/americanexpress/one-app-router/raw/main/one-app-router.png' width='50%'/>
</h1>

[![npm](https://img.shields.io/npm/v/@americanexpress/one-app-router)](https://www.npmjs.com/package/@americanexpress/one-app-router)
[![Build Status](https://travis-ci.org/americanexpress/one-app-router.svg?branch=main)](https://travis-ci.org/americanexpress/one-app-router)

> One App Router keeps your UI in sync with the URL. It has a simple API with powerful features like lazy code
> loading, dynamic route matching, and location transition handling built right in.
> Make the URL your first thought, not an after-thought.

One App Router was forked from [react-router@3](https://github.com/ReactTraining/react-router/tree/v3) and is being uplifted to work with `react@17`.

The reason for forking `react-router@3`, rather than switching to a different router or upgrading to a newer version, is due to the coupling of `react-router@3`'s API with [One App](https://github.com/americanexpress/one-app), [Holocron](https://github.com/americanexpress/holocron) and existing One App modules.

We want to ensure that One App will be compatible with `react@17`, in its current state `react-router@3` relies on React's legacy context API, which will be removed in `react@17`, as well as legacy UNSAFE lifecycle methods.

Updating to the new context API would be considered a breaking change as `react-router` would no longer be compatible with older versions of `react@<16.3.0`. The `react-router` project has already moved to v5 therefore it is not possible to make any breaking changes to `react-router@3`.

We will evaluate moving to `react-router@6` if it matches our use case in the future.

This is not meant to be a generic standalone Routing library but one which will be tailored for use with the One ecosystem.

## 👩‍💻 Hiring 👨‍💻

Want to get paid for your contributions to `one-app-router`?
> Send your resume to oneamex.careers@aexp.com

## 📖 Table of Contents

* [Features](#-features)
* [Usage](#-usage)
* [Git Hooks](#-git-hooks)
* [Contributing](#-contributing)
* [License](#-license)
* [Code of Conduct](#-code-of-conduct)

## ✨ Features

* Keeps your UI in sync with the URL
* Lazy code loading
* Dynamic route matching
* Location transition handling

## 🤹‍ Usage

### Installation
```
$ npm install @americanexpress/one-app-router
```

Then with a module bundler like [webpack](https://webpack.github.io/) that supports either CommonJS or ES2015 modules, use as you would anything else:

```js
// using an ES6 transpiler, like babel
import { Router, Route, Link } from '@americanexpress/one-app-router'

// not using an ES6 transpiler
var Router = require('@americanexpress/one-app-router').Router
var Route = require('@americanexpress/one-app-router').Route
var Link = require('@americanexpress/one-app-router').Link
```

### See it in action

```js
import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Link, browserHistory } from '@americanexpress/one-app-router';

function App() {/*...*/}
function About() {/*...*/}
function NoMatch() {/*...*/}

async function getUsersFragment() {/*...*/}
async function findUserById() {/*...*/}

function Users({ children }) {
  const [users, setUsers] = React.useState([]);
  React.useEffect(() => {
    getUsersFragment().then(setUsers);
  }, []);

  return (
    <div>
      <h1>Users</h1>
      <div className="master">
        <ul>
          {/* use Link to route around the app */}
          {users.map(user => (
            <li key={user.id}>
              <Link to={`/user/${user.id}`}>{user.name}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="detail">
        {children}
      </div>
    </div>
  );
}

function User({ params }) {
  const [user, setUser] = React.useState(null);
  React.useEffect(() => {
    findUserById(params.userId).then(setUser);
  }, []);

  return user && (
    <div>
      <h2>{user.name}</h2>
      {/* etc. */}
    </div>
  );
}

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


## 🏆 Contributing

We welcome Your interest in the American Express Open Source Community on Github.
Any Contributor to any Open Source Project managed by the American Express Open
Source Community must accept and sign an Agreement indicating agreement to the
terms below. Except for the rights granted in this Agreement to American Express
and to recipients of software distributed by American Express, You reserve all
right, title, and interest, if any, in and to Your Contributions. Please [fill
out the Agreement](https://cla-assistant.io/americanexpress/one-app-router).

Please feel free to open pull requests and see [CONTRIBUTING.md](./CONTRIBUTING.md) to learn how to get started contributing.

## 🗝️ License

Any contributions made under this project will be governed by the [Apache 2.0 License](LICENSE.txt).

## 🗣️ Code of Conduct

This project adheres to the [American Express Community Guidelines](./CODE_OF_CONDUCT.md).
By participating, you are expected to honor these guidelines.

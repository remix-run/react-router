# react-router-redux

[![npm version](https://img.shields.io/npm/v/react-router-redux.svg?style=flat-square)](https://www.npmjs.com/package/react-router-redux) [![npm downloads](https://img.shields.io/npm/dm/react-router-redux.svg?style=flat-square)](https://www.npmjs.com/package/react-router-redux) [![build status](https://img.shields.io/travis/reactjs/react-router-redux/master.svg?style=flat-square)](https://travis-ci.org/reactjs/react-router-redux)

> **Keep your state in sync with your router** :sparkles:

This is beta software, it needs:

1. A working example
2. Some people to try it out and find bugs
3. A strategy for working with the devtools
   - (issue describing a different approach to what we've seen previously coming soon)

## Installation

```
npm install --save react-router-redux@next
```

## Usage

Here's how to get a basic example up and running using [Create React App](https://github.com/facebookincubator/create-react-app):

```sh
npm install -g create-react-app
create-react-app demo-app
cd demo-app
```

```sh
yarn add react-router-dom react-router-redux@next redux react-redux
# or, if you're not using yarn
npm install react-router-dom react-router-redux@next redux react-redux
```

Now you can copy/paste this example into src/App.js.

```js
import React from 'react';
import { connect, Provider } from 'react-redux';
import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose,
} from 'redux'
import {
  Route,
  Switch,
  Link,
} from 'react-router-dom'
import {
  ConnectedRouter,
  routerReducer,
  routerMiddleware,
} from 'react-router-redux'

import createHistory from 'history/createBrowserHistory'

const About = () => <h2>About</h2>
const Company = () => <h2>Company</h2>

const App = () => (
  <div>
     <ul>
       <li><Link to="/about">About Us</Link></li>
       <li><Link to="/company">Company</Link></li>
     </ul>
     <Switch>
       <Route path="/about" component={About}/>
       <Route path="/company" component={Company}/>
     </Switch>
  </div>
);

// opt into the Redux dev tools Chrome extension
const devtools = window.devToolsExtension || (() => noop => noop);

const history = createHistory();

const middleware = [
  routerMiddleware(history),
];

const enhancers = [
  devtools(),
  applyMiddleware(...middleware),
];

const ConnectedApp = connect()(App);

const appReducer = (state = {}, action) => state;

const store = createStore(
  combineReducers({
    app: appReducer,
    router: routerReducer
  }),
  compose(...enhancers),
)

const ReactReduxRouterExample = () => (
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Route component={ConnectedApp} />
    </ConnectedRouter>
  </Provider>
);

export default ReactReduxRouterExample;
```

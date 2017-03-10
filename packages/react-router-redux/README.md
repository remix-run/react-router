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
npm install --save react-router-redux
```

## Usage

Here's a basic idea of how it works:

```js
import React from 'react'
import ReactDOM from 'react-dom'

import { createStore, combineReducers, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'

import createHistory from 'history/createBrowserHistory'
import { Route } from 'react-router'

import { ConnectedRouter, routerReducer, routerMiddleware, push } from 'react-router-redux'

import reducers from './reducers' // Or wherever you keep your reducers

// Create a history of your choosing (we're using a browser history in this case)
const history = createHistory()

// Build the middleware for intercepting and dispatching navigation actions
const middleware = routerMiddleware(history)

// Add the reducer to your store on the `router` key
// Also apply our middleware for navigating
const store = createStore(
  combineReducers({
    ...reducers,
    router: routerReducer
  }),
  applyMiddleware(middleware)
)

// Now you can dispatch navigation actions from anywhere!
// store.dispatch(push('/foo'))

ReactDOM.render(
  <Provider store={store}>
    { /* ConnectedRouter will use the store from Provider automatically */ }
    <ConnectedRouter history={history}>
      <div>
        <Route exact path="/" component={Home}/>
        <Route path="/about" component={About}/>
        <Route path="/topics" component={Topics}/>
      </div>
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
)
```

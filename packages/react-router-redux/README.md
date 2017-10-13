# react-router-redux

[![npm version](https://img.shields.io/npm/v/react-router-redux/next.svg?style=flat-square)](https://www.npmjs.com/package/react-router-redux)  [![npm downloads](https://img.shields.io/npm/dm/react-router-redux.svg?style=flat-square)](https://www.npmjs.com/package/react-router-redux) [![build status](https://img.shields.io/travis/reactjs/react-router-redux/master.svg?style=flat-square)](https://travis-ci.org/reactjs/react-router-redux)

> **Keep your state in sync with your router** :sparkles:

This is beta software, it needs:

1. ~~A working example~~
2. Some people to try it out and find bugs
3. A strategy for working with the devtools
   - (issue describing a different approach to what we've seen previously coming soon)

## Versions

This (react-router-redux 5.x) is the version of react-router-redux for use with react-router 4.x.
Users of react-router 2.x and 3.x want to use react-router-redux found at [the legacy repository](https://github.com/reactjs/react-router-redux).

## Installation

```
npm install --save react-router-redux@next
npm install --save history
```

## Usage (Client)

Your application entry point (in this case, `index.js`) may look something like this:

```js
import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter, push } from 'react-router-redux';
import store, { history } from './store';

import App from './containers/app';

import './index.css';

// Now you can dispatch navigation actions from anywhere!
// store.dispatch(push('/foo'))

// ConnectedRouter will use the store from Provider automatically
render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Route component={App} />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);
```

You can opt to load whatever components you want inside of `ConnectedRouter`. In the example above, we load a single `<App>` component which handles all routing to other files there. Alternatively, you may declare all your routes in this file, leaving it up to the developer's organizational discretion. If you have a single component (in this case, `<App>`) then it will make any server-side rendering logic much simpler. You will not need to update your routes on both the client and the server, but simply just the client. See the "Usage (Server)" example below for more details.

An example `store.js` might look like such:

```js
import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

// We load in a BrowserHistory since we're on the client-side
import createHistory from 'history/createBrowserHistory';

// All of your reducers are loaded in, see next file below...
import rootReducer from './modules';

export const history = createHistory();

const initialState = {};
const enhancers = [];

// Build the middleware for intercepting and dispatching navigation actions, in this case we're using thunk and HTML5 history
const middleware = [thunk, routerMiddleware(history)];

// Dev tools if you would like them
if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);
const store = createStore(rootReducer, initialState, composedEnhancers);

export default store;
```

And finally, your reducer structure (`modules/index.js`):

```js
import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

export default combineReducers({
  router: routerReducer,
  ...allMyOtherReducers
});

```

## Usage (Server)

Usage on the server (for server-side rendering) is relatively simple as well. There's no need to distinguish between `BrowserRouter` and `StaticRouter` since `ConnectedRouter` will handle this distinction. Setting up a full Express/Node application to run your server is beyond the scope of this documentation. For a tutorial using `ConnectedRouter` on both the client and server side, please see [this post](https://medium.com/@cereallarceny/server-side-rendering-with-create-react-app-fiber-react-router-v4-helmet-redux-and-thunk-275cb25ca972) and [this repository](https://github.com/cereallarceny/cra-ssr) for an example.

To implement basic server-side rendering, you'll need to create a universal loader which will take in any route, create a history based on the URL being requested, render the DOM to a string and return the result.  A basic example of this code would look like such:

```js
import path from 'path';
import fs from 'fs';

import React from 'react';
import { renderToString } from 'react-dom/server';

import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import { Route } from 'react-router-dom';
import createServerStore from './store';

// The same <App> that we loaded on the client
// Creating a single app container allows you to not need to duplicate your routes on both the client and server
import App from '../src/containers/app';

const universalLoader = (req, res) => {
  // Load in our HTML file from our build directory (in this case, create-react-app)
  const filePath = path.resolve(__dirname, '../build/index.html');

  fs.readFile(filePath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Read error', err);

      return res.status(404).end();
    }

    // Create a store and sense of history based on the current path
    const { store, history } = createServerStore(req.path);

    // Render <App> in React same as on the client-side (see above)
    const routeMarkup = renderToString(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Route component={App} />
        </ConnectedRouter>
      </Provider>
    );

    res.send(htmlData.replace(
      '<div id="root"></div>',
      `<div id="root">${routeMarkup}</div>`
    ));
  });
};

export default universalLoader;
```

And of course, we need to define what our `store.js` looks like:

```js
import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

// On the server we use MemoryHistory, that's an important distinction
import createHistory from 'history/createMemoryHistory';

// Where your reducers come from (see client-side example above)
import rootReducer from '../src/modules';

// Create a store and history based on a path
const createServerStore = (path = '/') => {
  const initialState = {};

  // We don't have a DOM, so let's create a history and push the current path
  const history = createHistory({ initialEntries: [path] });

  // Apply your middleware as necessary
  const middleware = [thunk, routerMiddleware(history)];
  const composedEnhancers = compose(applyMiddleware(...middleware));

  // Create the store
  const store = createStore(rootReducer, initialState, composedEnhancers);

  // Return all that we need
  return {
    history,
    store
  };
};

export default createServerStore;
```

# Server-side Rendering

Server-side rendering doesn't have to be difficult and RRR5 makes this _really_ simple. If you're wanting a detailed tutorial on how to implement server-side rendering using `create-react-app`, be sure to visit this [this post](https://medium.com/@cereallarceny/server-side-rendering-with-create-react-app-fiber-react-router-v4-helmet-redux-and-thunk-275cb25ca972) and [this repository](https://github.com/cereallarceny/cra-ssr) for an example.

## Client

Your application entry point (in this case, `client.js`) is fairly standard. You hook up to a store (`client-store.js`) that loads your reducers (`reducers.js`) and load in your main entry component (`<App>`).

You can opt to load whatever components you want inside of `ConnectedRouter`. In the example above, we load a single `<App>` component which handles all routing to other files there. Alternatively, you may declare all your routes in this file, leaving it up to the developer's organizational discretion. If you have a single component (in this case, `<App>`) then it will make any server-side rendering logic much simpler. You will not need to update your routes on both the client and the server, but simply just the client. See the "Server" below for more details.

## Server

Usage on the server (for server-side rendering) is relatively simple as well. Just like on the client, we will use a `ConnectedRouter`. The only difference is that we will pass it a `MemoryHistory` instance instead of a `BrowserHistory`. Setting up a full Express/Node application to run your server is beyond the scope of this documentation. For a tutorial using `ConnectedRouter` on both the client and server side, please see [this post](https://medium.com/@cereallarceny/server-side-rendering-with-create-react-app-fiber-react-router-v4-helmet-redux-and-thunk-275cb25ca972) and [this repository](https://github.com/cereallarceny/cra-ssr) for an example.

To implement basic server-side rendering, you'll need to create a universal loader which will take in any route, create a history based on the URL being requested, render the DOM to a string and return the result.  A basic example of this code (`server.js`) would look like such:

```js
import path from 'path'
import fs from 'fs'

import React from 'react'
import { renderToString } from 'react-dom/server'

import { Provider } from 'react-redux'
import { ConnectedRouter } from 'react-router-redux'
import { Route } from 'react-router-dom'
import createServerStore from './server-store'

// The same <App> that we loaded on the client
// Creating a single app container allows you to not need to duplicate your routes on both the client and server
import App from '../path/to/App'

const universalLoader = (req, res) => {
  // Load in our HTML file from our build directory (in this case, create-react-app)
  const filePath = path.resolve(__dirname, '../build/index.html')

  fs.readFile(filePath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Read error', err)

      return res.status(404).end()
    }

    // Create a store and sense of history based on the current path
    const { store, history } = createServerStore(req.path)

    // Render <App> in React same as on the client-side (see above)
    const routeMarkup = renderToString(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <Route component={App} />
        </ConnectedRouter>
      </Provider>
    )

    res.send(
      htmlData.replace(
        '<div id="root"></div>',
        `<div id="root">${routeMarkup}</div>`
      )
    )
  })
}

export default universalLoader
```

And of course, we need to define what our `server-store.js` looks like. The store on the server-side does nearly the same operations as on the client, but instead it instantiates a store based on an path provided by node (see `req.path` above). Likewise, instead of creating a `BrowserHistory`, we specify a `MemoryHistory` instead seeing as Node does not have access to the DOM. An example server-side store is below:

```js
import { createStore, applyMiddleware, compose } from 'redux'
import { routerMiddleware } from 'react-router-redux'
import thunk from 'redux-thunk'

// On the server we use MemoryHistory, that's an important distinction
import createHistory from 'history/createMemoryHistory'
g
// Where your reducers come from (see client-side example above)
import rootReducer from '../src/modules'

// Create a store and history based on a path
const createServerStore = (path = '/') => {
  const initialState = {}

  // We don't have a DOM, so let's create a history and push the current path
  const history = createHistory({ initialEntries: [path] })

  // Apply your middleware as necessary
  const middleware = [thunk, routerMiddleware(history)]
  const composedEnhancers = compose(applyMiddleware(...middleware))

  // Create the store
  const store = createStore(rootReducer, initialState, composedEnhancers)

  // Return all that we need
  return {
    history,
    store
  }
}

export default createServerStore
```

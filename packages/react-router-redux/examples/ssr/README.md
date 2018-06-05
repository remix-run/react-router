# Server-side Rendering

Server-side rendering doesn't have to be difficult and RRR5 makes this _really_
simple. If you're wanting a detailed tutorial on how to implement server-side
rendering using `create-react-app`, be sure to visit this
[this post](https://medium.com/@cereallarceny/server-side-rendering-with-create-react-app-fiber-react-router-v4-helmet-redux-and-thunk-275cb25ca972)
and [this repository](https://github.com/cereallarceny/cra-ssr) for an example.

## Client

Your application entry point (in this case, `client.js`) is fairly standard. You
hook up to a store (`client-store.js`) that loads your reducers (`reducers.js`)
and load in your main entry component (`<App>`).

You can opt to load whatever components you want inside of `ConnectedRouter`. In
the example above, we load a single `<App>` component which handles all routing
to other files there. Alternatively, you may declare all your routes in this
file, leaving it up to the developer's organizational discretion. If you have a
single entry-point component (in this case, `<App>`) then it will make any
server-side rendering logic much simpler. You will not need to update your
routes on both the client and the server, but simply just the client. See the
"Server" below for more details.

## Server

Usage on the server (for server-side rendering) is relatively simple as well.
Since the server doesn't need to have any concept of "state", we can render a
simple `StaticRouter` with our `App` component nested within. Setting up a full
Express/Node application to run your server is beyond the scope of this
documentation.

To implement basic server-side rendering, you'll need to create a universal
loader which will take in any route, render the DOM to a string, and return the
result. A basic example of this code (`server.js`) would look like such:

```jsx
import path from 'path';
import fs from 'fs';

import React from 'react';
import { renderToString } from 'react-dom/server';

import { StaticRouter } from 'react-router-redux';
import { Route } from 'react-router-dom';

// The same <App> that we loaded on the client
// Creating a single app container allows you to not need to duplicate your routes on both the client and server
import App from '../path/to/App';

const universalLoader = (req, res) => {
  // Load in our HTML file from our build directory (in this case, create-react-app)
  const filePath = path.resolve(__dirname, '../build/index.html');

  fs.readFile(filePath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('Read error', err);

      return res.status(404).end();
    }

    // Declare an empty context
    const context = {};

    // Render <App> in React
    const routeMarkup = renderToString(
      <StaticRouter location={req.url} context={context}>
        <Route component={App} />
      </StaticRouter>
    );

    res.send(
      htmlData.replace(
        '<div id="root"></div>',
        `<div id="root">${routeMarkup}</div>`
      )
    );
  });
};

export default universalLoader;
```

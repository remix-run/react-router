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

import React from 'react';
import { Component, routes } from './App';
import { StaticRouter } from 'react-router-dom';
import express from 'express';
import { matchRoutes, renderRoutes } from 'react-router-config';
import { renderToString } from 'react-dom/server';

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

// 4. match route to components, check and execute loadData functions
const loadBranchData = (location) => {
  // mactch routes to current requested location.
  const branch = matchRoutes(routes, location.pathname);
  // map over matching routes, if route has loadData prop, add to list of promises
  const promises = branch.map(({ route, match }) => {
    return route.loadData
      ? route.loadData(match)
      : Promise.resolve(null)
  });
  // return all promises once all resolved.
  // network -> response -> data -> resolve
  return Promise.all(promises);
};

const server = express();
server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', (req, res) => {
    // load data before render
    loadBranchData(req.baseUrl)
      // data is returned after all promises resolve inject in component directly
      // pass data to window object to retrieve from client later.
      .then(data => {
        const context = {};
        const markup = renderToString(<Component data={data[0]} />);

        if (context.url) {
          res.redirect(context.url);
        } else {
          res.status(200).send(
            `<!doctype html>
              <html lang="">
              <head>
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta charset="utf-8" />
                <title>Welcome to Razzle</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                ${assets.client.css
                  ? `<link rel="stylesheet" href="${assets.client.css}">`
                  : ''}
                ${process.env.NODE_ENV === 'production'
                  ? `<script src="${assets.client.js}" defer></script>`
                  : `<script src="${assets.client.js}" defer crossorigin></script>`}
              </head>
              <body>
                  <div id="root">${markup}</div>
                  <script>window.__PRELOADED_STATE__ = ${JSON.stringify(data)};</script>
              </body>
          </html>`
          );
        }
      })
      .catch(e => {
        console.log(e);
        res.status(500).send({error: e})
      })
  });

export default server;

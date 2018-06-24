import url from 'url';
import {renderToString} from 'react-dom/server';

import React from 'react';
import { Provider } from 'react-redux';
import { StaticRouter, matchPath } from 'react-router-dom';
import { matchRoutes } from 'react-router-config';

import App from '../App';


export const loadData = async (store, routes, url) => {
  // find matching routes
  const branch = matchRoutes(routes, url);
  // filter routes without fetchData prop
  const matches = branch.filter(({ route, match }) => typeof route.fetchData === 'function')
  // add fetchData to promise list
  const promises = matches.map(({ route, match}) => {
    return route.fetchData(store);
  })
  // we are calling [ route1.fetchData, route2.fetchData, ...]
  // each of these functions must return a promise, see ../routes.js for further
  // details.
  await Promise.all(promises);
  // once all fetchData functions have resolved, we can fetch current state and
  // use this to build our store for initial load.
  return store.getState();
};

export const getMarkup = (store, url, context) => renderToString(
  <Provider store={store}>
    <StaticRouter location={url} context={context}>
      <App />
    </StaticRouter>
  </Provider>
);

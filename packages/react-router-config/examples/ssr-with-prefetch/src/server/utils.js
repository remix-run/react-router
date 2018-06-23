import url from 'url';
import {renderToString} from 'react-dom/server';

import React from 'react';
import { Provider } from 'react-redux';
import { StaticRouter, matchPath } from 'react-router-dom';
import { matchRoutes } from 'react-router-config';

import App from '../App';


export const loadData = (store, routes, url) => {
  // find matching routes
  const branch = matchRoutes(routes, url);
  // filter routes without fetchData prop
  const matches = branch.filter(({ route, match }) => typeof route.fetchData === 'function')
  // add fetchData to promise list
  const promises = matches.map(({ route, match}) => {
    return route.fetchData(store)
  })
  // return promises
  return Promise.all(promises);
};

export const getMarkup = (store, url, context) => renderToString(
  <Provider store={store}>
    <StaticRouter location={url} context={context}>
      <App />
    </StaticRouter>
  </Provider>
);

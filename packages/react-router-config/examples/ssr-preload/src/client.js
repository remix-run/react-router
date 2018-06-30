import { Component, routes } from './App';
import { renderRoutes } from 'react-router-config';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import React from 'react';
import { hydrate } from 'react-dom';

const data = window.__PRELOADED_STATE__[0];
// then pass data to your favorite data store.

hydrate(
  <BrowserRouter>
    <Component data={data} />
  </BrowserRouter>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept();
}

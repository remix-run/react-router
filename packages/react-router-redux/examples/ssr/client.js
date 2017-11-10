import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Route } from 'react-router-dom';
import { ConnectedRouter, push } from 'react-router-redux';
import store, { history } from './client-store';

import App from '../path/to/App';

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

import React from 'react';
import { hydrate } from 'react-dom';
import { Provider } from 'react-redux';
import createHistory from 'history/createBrowserHistory';
import { ConnectedRouter } from 'react-router-redux';

import App from './App';
import configureStore from './store/configureStore';

// grab state from window object, then delete it.
const preloadedState = window.__PRELOADED_STATE__;
console.log(preloadedState);
console.log(window);
delete window.__PRELOADED_STATE__;

const history = createHistory();
const store = configureStore(history, preloadedState);

hydrate(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <App />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./App', () => {
    hydrate(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </Provider>,
      document.getElementById('root')
    );
  });
}

import { createStore, applyMiddleware } from 'redux';
import rootReducer from './createReducers';
import { routerMiddleware } from 'react-router-redux'

// middleWare
import thunkMiddleware from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension';

export default (history, preloadedState) => {
  const store = createStore(
    rootReducer,
    preloadedState,
    composeWithDevTools(
      applyMiddleware(
        thunkMiddleware,
        routerMiddleware(history),
      )
    ),
  );

  if (module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('./createReducers', () => {
      const nextRootReducer = require('./createReducers').default;
      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
};

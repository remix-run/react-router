import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

// We load in a BrowserHistory since we're on the client-side
import createHistory from 'history/createBrowserHistory';

// All of your reducers are loaded in, see next file below...
import rootReducer from './reducers';

export const history = createHistory();

const initialState = {};
const enhancers = [];

// Build the middleware for intercepting and dispatching navigation actions, in this case we're using thunk and HTML5 history
const middleware = [thunk, routerMiddleware(history)];

// Dev tools if you would like them
if (process.env.NODE_ENV === 'development') {
  const devToolsExtension = window.devToolsExtension;

  if (typeof devToolsExtension === 'function') {
    enhancers.push(devToolsExtension());
  }
}

const composedEnhancers = compose(applyMiddleware(...middleware), ...enhancers);
const store = createStore(rootReducer, initialState, composedEnhancers);

export default store;

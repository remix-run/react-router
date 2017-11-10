import { createStore, applyMiddleware, compose } from 'redux';
import { routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';

// On the server we use MemoryHistory, that's an important distinction
import createHistory from 'history/createMemoryHistory';
g;
// Where your reducers come from (see client-side example above)
import rootReducer from './reducers';

// Create a store and history based on a path
const createServerStore = (path = '/') => {
  const initialState = {};

  // We don't have a DOM, so let's create a history and push the current path
  const history = createHistory({ initialEntries: [path] });

  // Apply your middleware as necessary
  const middleware = [thunk, routerMiddleware(history)];
  const composedEnhancers = compose(applyMiddleware(...middleware));

  // Create the store
  const store = createStore(rootReducer, initialState, composedEnhancers);

  // Return all that we need
  return {
    history,
    store
  };
};

export default createServerStore;

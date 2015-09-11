import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import * as reducers from '../reducers/index';
import { devTools, persistState } from 'redux-devtools';
import thunk from 'redux-thunk';

const finalCreateStore = compose(
  applyMiddleware(thunk),
  devTools(),
  persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/))
)(createStore);

const reducer = combineReducers(reducers);

export default finalCreateStore(reducer);

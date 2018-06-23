import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux'
import chuck from '../chuck/reducer';

export default combineReducers({
  chuck,
  router: routerReducer,
});

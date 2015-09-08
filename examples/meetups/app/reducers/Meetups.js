import { combineReducers } from 'redux';

import {
  RECEIVE_GROUPS,
  REQUEST_GROUPS,
  INVALIDATE_GROUPS,
  GET_MEETUP,
  INVALIDATE_MEETUP,
} from '../constants/Types';

const defaultState = {
  data: [],
  isLoading: true,
};

function groups(state = defaultState, action) {
  switch (action.type) {
  case RECEIVE_GROUPS:
    return {
      data: action.groups,
      isLoading: false
    };

  case REQUEST_GROUPS:
    return defaultState;

  case INVALIDATE_GROUPS:
    return defaultState;

  default:
    return state;
  }
}

function single(state = {}, action) {
  switch (action.type) {
  case GET_MEETUP:
    return action.meetup;
  case INVALIDATE_MEETUP:
    return {
      isLoading: true
    };
  default:
    return state;
  }
}


export default combineReducers({groups, single});

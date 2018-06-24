import { NEW_JOKE, CLEAR_JOKES } from './action';
const initialState = []

export default (state=initialState, action) => {
  switch(action.type) {
    case NEW_JOKE:
      return [
        action.payload,
        ...state,
      ];
    case CLEAR_JOKES:
      return [];
    default:
      return state;
  }
}

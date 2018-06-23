import { NEW_JOKE } from './action';
const initialState = []

export default (state=initialState, action) => {
  switch(action.type) {
    case NEW_JOKE:
      return [
        action.payload,
        ...state,
      ];
    default:
      return state;
  }
}

import axios from 'axios';

export const NEW_JOKE = 'NEW_JOKE';
export const CLEAR_JOKES = 'CLEAR_JOKES';

export const fetchJoke = () => (dispatch) => {
  // actions used in preFetch must return a promise, axios calls return a promise
  // so we do not need to return one ourselves.
  return axios.get('https://api.chucknorris.io/jokes/random')
  .then(resp => resp.data)
  .then(payload => {
    dispatch({
      type: NEW_JOKE,
      payload,
    });
  })
  .catch(err => console.warn(err));
};

export const refreshPage = () => window.location.reload();

export const clearJokes = () => {
  console.log(window);
  return {
    type: CLEAR_JOKES,
  }
}

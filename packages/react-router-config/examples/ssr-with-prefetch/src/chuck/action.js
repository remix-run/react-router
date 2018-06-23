import axios from 'axios';

export const NEW_JOKE = 'NEW_JOKE';

export const fetchJoke = () => dispatch => {
  axios.get('https://api.chucknorris.io/jokes/random')
  .then(resp => resp.data)
  .then(payload => dispatch({
    type: NEW_JOKE,
    payload
  }))
  .catch(err => console.warn(err));
};

export const refreshPage = () => window.location.reload();

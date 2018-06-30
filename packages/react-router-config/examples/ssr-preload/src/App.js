import React from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import BrowserRouter from 'react-router-dom/BrowserRouter';

export const Component = (props) => {
  // data is either defined from props given from server.
  // or from window object.
  let data;
  if (window) {
    data = window.__PRELOADED_STATE__[0];
  } else {
    data = props.data;
  }
  {window && console.log(window.__PRELOADED_STATE__)}
  return (
    <div>
      <h1>So very server side rendered</h1>
      <div style={{ display: 'flex'}}>
        <img src={data.icon_url} width="50px" alt="chuck is norris"/>
        <p>{data.value}</p>
      </div>
    </div>
  )
}

Component.propTypes = {
  data: PropTypes.shape({}),
};

Component.defaultProps = {
  data: {
    value: '',
    icon_url: '',
  },
};

// define routes for application,
// see https://github.com/ReactTraining/react-router/tree/master/packages/react-router-config#route-configuration-shape
export const routes = [
  { component: Component,
    loadData: (match) => {
      return axios.get('https://api.chucknorris.io/jokes/random')
      .then(resp => resp.data)
      .catch(err => console.warn(err));
    },
  }
];

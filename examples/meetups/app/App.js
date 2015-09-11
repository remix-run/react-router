import React, { Component } from 'react';
import { Provider } from 'react-redux';
// import { DevTools, DebugPanel, LogMonitor } from 'redux-devtools/lib/react';
import { Router } from 'react-router';
import routes from './routes';
import store from './stores';
import './app.less';
import * as core from 'core-js';

export default class App extends Component {
  render() {
    return (
      <div>
        <h1 className="title">Tech Meetups</h1>
        <div className="subtitle">ReactJS + Redux + React Router + Webpack + ES.later</div>
        <Provider store={store}>
          <Router children={routes} />
        </Provider>
        { /* <DebugPanel top right bottom> */}
        { /* <DevTools store={store} monitor={LogMonitor} /> */ }
        { /* </DebugPanel> */ }
      </div>
    );
  }
}

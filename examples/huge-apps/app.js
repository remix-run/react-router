import React from 'react';
import createHistory from 'history/lib/createHashHistory';
import { Router } from 'react-router';
import AsyncProps from 'react-router/lib/experimental/AsyncProps';
import stubbedCourses from './stubs/COURSES';

var history = createHistory();

var rootRoute = {
  component: AsyncProps,

  // iunno?
  renderInitialLoad() {
    return <div>loading...</div>
  },

  childRoutes: [{
    path: '/',
    component: require('./components/App'),
    childRoutes: [
      require('./routes/Calendar'),
      require('./routes/Course'),
      require('./routes/Grades'),
      require('./routes/Messages'),
      require('./routes/Profile'),
    ]}
  ]
};

React.render((
  <Router
    history={history}
    routes={rootRoute}
    createElement={AsyncProps.createElement}
  />
), document.getElementById('example'));

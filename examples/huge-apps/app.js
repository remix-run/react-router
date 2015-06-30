import React from 'react';
import { history } from 'react-router/lib/HashHistory';
import { Router } from 'react-router';
import AsyncProps from 'react-router/lib/experimental/AsyncProps';
import stubbedCourses from './stubs/COURSES';

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
    routes={rootRoute}
    history={history}
    createElement={AsyncProps.createElement}
  />
), document.getElementById('example'));

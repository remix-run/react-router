import React from 'react';
import createHistory from 'history/lib/createHashHistory';
import { Router } from 'react-router';
import stubbedCourses from './stubs/COURSES';

var rootRoute = {
  component: 'div',
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

var history = createHistory();

React.render((
  <Router history={history} routes={rootRoute} />
), document.getElementById('example'));

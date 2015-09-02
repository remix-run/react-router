import React from 'react';
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
    ]
  }]
};

React.render(
  <Router routes={rootRoute} />,
  document.getElementById('example')
);

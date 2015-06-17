import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
import { Router } from 'react-router';
import AsyncProps from 'react-router/lib/experimental/AsyncProps';
import stubbedCourses from './stubs/courses';

var rootRoute = {
  path: '/',

  childRoutes: [
    require('./routes/Calendar'),
    require('./routes/Course'),
    require('./routes/Grades'),
    require('./routes/Messages'),
    require('./routes/Profile'),
  ],

  component: require('./components/App'),
};

React.render((
  <Router
    children={rootRoute}
    history={new HashHistory}
    createElement={AsyncProps.createElement}
  />
), document.getElementById('example'));


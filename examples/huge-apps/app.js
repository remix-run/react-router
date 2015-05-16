import stubbedCourses from './stubs/courses';
import React from 'react';
import { createRouter, Route, Link } from 'react-router';
import History from 'react-router/HashHistory';
import getAsyncProps from './lib/getAsyncProps';

const rootRoute = {
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

const Router = createRouter(rootRoute);

History.listen((location) => {
  Router.match(location, (err, props) => {
    getAsyncProps(props, (err, newProps) => {
      // swallowed errors?!
      setTimeout(() => {
        React.render(<Router {...newProps} />, document.getElementById('example'));
      }, 0);
    });
  });
});


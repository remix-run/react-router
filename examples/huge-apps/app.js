import React from 'react';
import HashHistory from 'react-router/lib/HashHistory';
import { Router, Route, Link } from 'react-router';
import getAsyncProps from './lib/getAsyncProps';
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

//var Router = createRouter(rootRoute);
//
//History.listen((location) => {
//  Router.match(location, (err, props) => {
//    getAsyncProps(props, (err, newProps) => {
//      // swallowed errors?!
//      setTimeout(() => {
//        React.render(<Router {...newProps} />, document.getElementById('example'));
//      }, 0);
//    });
//  });
//});

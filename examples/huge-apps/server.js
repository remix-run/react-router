if (typeof require.ensure !== "function")
  require.ensure = function (d, c) { c(require) };

import React from 'react';
import { createRouter } from 'react-router';
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

Router.run('/', (err, props) => {
  getAsyncProps(props, (err, newProps) => {
    // swallowed errors?!
    setTimeout(() => {
      var html = React.renderToString(<Router {...newProps} />);
      console.log(html);
    }, 0);
  });
});




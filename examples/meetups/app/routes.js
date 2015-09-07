import React from 'react';
import { Route, IndexRoute } from 'react-router';

import MeetupList from './views/meetup/MeetupList';
import MeetupDetail from './views/meetup/MeetupDetail';
import About from './views/About';
import Nav from './views/Nav';

export default (
  <Route component={Nav} path="/">
    <IndexRoute component={MeetupList} />
    <Route component={MeetupDetail} path="/meetup/:id" />
    <Route component={MeetupList} path="/geo/:coords" />
    <Route component={About} path="/about" />
  </Route>
);

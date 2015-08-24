import expect from 'expect';
import React from 'react';
import { createLocation } from 'history';
import Router from '../Router';
import Link from '../Link';

describe.skip('server rendering', function () {
  var Dashboard, DashboardRoute, routes;
  beforeEach(function () {
    Dashboard = React.createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
          </div>
        );
      }
    });

    DashboardRoute = {
      path: '/',
      component: Dashboard
    };

    routes = [
      DashboardRoute
    ];
  });
 
  it('works', function (done) {
    var location = createLocation('/');

    Router.run(routes, location, function (error, state) {
      var string = React.renderToString(<Router initialState={state} />);
      expect(string).toMatch(/The Dashboard/);
      done();
    });
  });
});

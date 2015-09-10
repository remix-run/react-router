import expect from 'expect';
import React from 'react';
import createHistory from 'history/lib/createMemoryHistory';
import createLocation from 'history/lib/createLocation';
import RoutingContext from '../RoutingContext';
import useRoutes from '../useRoutes';

describe('server rendering', function () {
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
    var history = useRoutes(createHistory)({ routes });
    var location = createLocation('/');

    history.match(location, function (error, state) {
      var string = React.renderToString(
        <RoutingContext history={history} {...state} />
      );

      expect(string).toMatch(/The Dashboard/);

      done();
    });
  });
});

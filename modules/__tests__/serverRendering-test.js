import expect from 'expect';
import React from 'react';
import createLocation from 'history/lib/createLocation';
import RoutingContext from '../RoutingContext';
import match from '../match';
import Link from '../Link';

describe('server rendering', function () {
  var App, Dashboard, About, AppRoute, RedirectRoute, AboutRoute, DashboardRoute, routes;

  beforeEach(function () {
    App = React.createClass({
      render() {
        return (
          <div className="App">
            <h1>App</h1>
            <Link to="/about" activeClassName="about-is-active">About</Link>{' '}
            <Link to="/dashboard" activeClassName="dashboard-is-active">Dashboard</Link>
            <div>
              {this.props.children}
            </div>
          </div>
        );
      }
    })

    Dashboard = React.createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
          </div>
        );
      }
    });

    About = React.createClass({
      render() {
        return (
          <div className="About">
            <h1>About</h1>
          </div>
        );
      }
    });

    DashboardRoute = {
      path: '/dashboard',
      component: Dashboard
    };

    AboutRoute = {
      path: '/about',
      component: About
    };

    RedirectRoute = {
      path: '/company',
      onEnter (nextState, replaceState) {
        replaceState(null, '/about')
      }
    };

    AppRoute = routes = {
      path: '/',
      component: App,
      childRoutes: [ DashboardRoute, AboutRoute, RedirectRoute ]
    };
  });

  it('works', function (done) {
    var location = createLocation('/dashboard');
    match({ routes, location }, function (error, redirectLocation, renderProps) {
      var string = React.renderToString(
        <RoutingContext {...renderProps} />
      );
      expect(string).toMatch(/The Dashboard/);
      done();
    });
  });

  it('renders active Links as active', function (done) {
    var location = createLocation('/about');
    match({ routes, location }, function (error, redirectLocation, renderProps) {
      var string = React.renderToString(
        <RoutingContext {...renderProps} />
      );
      expect(string).toMatch(/about-is-active/);
      //expect(string).toNotMatch(/dashboard-is-active/); TODO add toNotMatch to expect
      done();
    });
  });

  it('sends the redirect location', function (done) {
    var location = createLocation('/company');
    match({ routes, location }, function (error, redirectLocation) {
      expect(redirectLocation).toExist();
      expect(redirectLocation.pathname).toEqual('/about')
      expect(redirectLocation.search).toEqual('')
      expect(redirectLocation.state).toEqual(null)
      expect(redirectLocation.action).toEqual('REPLACE')
      done();
    });
  });

  it('sends null values when no routes match', function (done) {
    var location = createLocation('/no-match');
    match({ routes, location }, function (error, redirectLocation, state) {
      expect(error).toBe(null);
      expect(redirectLocation).toBe(null);
      expect(state).toBe(null);
      done();
    });
  });

});

/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect, { spyOn } from 'expect';
import React from 'react';
import createHistory from 'history/lib/createMemoryHistory';
import execSteps from './execSteps';
import Router from '../Router';

describe('When a router enters a branch', function () {
  var node, Dashboard, NewsFeed, Inbox, DashboardRoute, NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, routes;
  beforeEach(function () {
    node = document.createElement('div');

    Dashboard = React.createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
            {this.props.children}
          </div>
        );
      }
    });

    NewsFeed = React.createClass({
      render() {
        return <div>News</div>;
      }
    });

    Inbox = React.createClass({
      render() {
        return <div>Inbox</div>;
      }
    });

    NewsFeedRoute = {
      path: 'news',
      component: NewsFeed,
      onEnter(nextState, replaceState) {
        expect(this).toBe(NewsFeedRoute);
        expect(nextState.routes).toContain(NewsFeedRoute);
        expect(replaceState).toBeA('function');
      },
      onLeave() {
        expect(this).toBe(NewsFeedRoute);
      }
    };

    InboxRoute = {
      path: 'inbox',
      component: Inbox,
      onEnter(nextState, replaceState) {
        expect(this).toBe(InboxRoute);
        expect(nextState.routes).toContain(InboxRoute);
        expect(replaceState).toBeA('function');
      },
      onLeave() {
        expect(this).toBe(InboxRoute);
      }
    };

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, replaceState) {
        expect(this).toBe(RedirectToInboxRoute);
        expect(nextState.routes).toContain(RedirectToInboxRoute);
        expect(replaceState).toBeA('function');

        replaceState(null, '/inbox');
      },
      onLeave() {
        expect(this).toBe(RedirectToInboxRoute);
      }
    };

    MessageRoute = {
      path: 'messages/:messageID',
      onEnter(nextState, replaceState) {
        expect(this).toBe(MessageRoute);
        expect(nextState.routes).toContain(MessageRoute);
        expect(replaceState).toBeA('function');
      },
      onLeave() {
        expect(this).toBe(MessageRoute);
      }
    };

    DashboardRoute = {
      component: Dashboard,
      onEnter(nextState, replaceState) {
        expect(this).toBe(DashboardRoute);
        expect(nextState.routes).toContain(DashboardRoute);
        expect(replaceState).toBeA('function');
      },
      onLeave() {
        expect(this).toBe(DashboardRoute);
      },
      childRoutes: [ NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute ]
    };

    routes = [
      DashboardRoute
    ];
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
  });

  it('calls the onEnter hooks of all routes in that branch', function (done) {
    var dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough();
    var newsFeedRouteEnterSpy = spyOn(NewsFeedRoute, 'onEnter').andCallThrough();

    React.render(<Router history={createHistory('/news')} routes={routes}/>, node, function () {
      expect(dashboardRouteEnterSpy).toHaveBeenCalled();
      expect(newsFeedRouteEnterSpy).toHaveBeenCalled();
      done();
    });
  });

  describe('and one of the transition hooks navigates to another route', function () {
    it('immediately transitions to the new route', function (done) {
      var redirectRouteEnterSpy = spyOn(RedirectToInboxRoute, 'onEnter').andCallThrough();
      var redirectRouteLeaveSpy = spyOn(RedirectToInboxRoute, 'onLeave').andCallThrough();
      var inboxEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();

      React.render(<Router history={createHistory('/redirect-to-inbox')} routes={routes}/>, node, function () {
        expect(this.state.location.pathname).toEqual('/inbox');
        expect(redirectRouteEnterSpy).toHaveBeenCalled();
        expect(redirectRouteLeaveSpy.calls.length).toEqual(0);
        expect(inboxEnterSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('and then navigates to another branch', function () {
    it('calls the onLeave hooks of all routes in the previous branch that are not in the next branch', function (done) {
      var dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough();
      var inboxRouteEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();
      var inboxRouteLeaveSpy = spyOn(InboxRoute, 'onLeave').andCallThrough();

      var steps = [
        function () {
          expect(inboxRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
          this.history.pushState(null, '/news');
        },
        function () {
          expect(inboxRouteLeaveSpy).toHaveBeenCalled('InboxRoute.onLeave was not called');
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
        }
      ];

      var execNextStep = execSteps(steps, done);

      React.render(
        <Router history={createHistory('/inbox')}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep);
    });
  });

  describe('and then navigates to the same branch, but with different params', function () {
    it('calls the onLeave and onEnter hooks of all routes whose params have changed', function (done) {
      var dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough();
      var dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough();
      var messageRouteLeaveSpy = spyOn(MessageRoute, 'onLeave').andCallThrough();
      var messageRouteEnterSpy = spyOn(MessageRoute, 'onEnter').andCallThrough();

      var steps = [
        function () {
          expect(dashboardRouteEnterSpy).toHaveBeenCalled('DashboardRoute.onEnter was not called');
          expect(messageRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
          this.history.pushState(null, '/messages/456');
        },
        function () {
          expect(messageRouteLeaveSpy).toHaveBeenCalled('MessageRoute.onLeave was not called');
          expect(messageRouteEnterSpy).toHaveBeenCalled('MessageRoute.onEnter was not called');
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
        }
      ];

      var execNextStep = execSteps(steps, done);

      React.render(
        <Router history={createHistory('/messages/123')}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep);
    });
  });
});

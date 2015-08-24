import expect, { spyOn } from 'expect';
import React from 'react';
import createHistory from 'history/lib/createMemoryHistory';
import execSteps from './execSteps';
import Router from '../Router';
import Route from '../Route';

describe.skip('When a router enters a branch', function () {
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
      onEnter(nextState, redirectTo) {
        expect(nextState.routes).toContain(NewsFeedRoute);
        expect(redirectTo).toBeA('function');
      },
      onLeave(nextState, redirectTo) {
        expect(nextState.routes).toNotContain(NewsFeedRoute);
        expect(redirectTo).toBeA('function');
      }
    };
  
    InboxRoute = {
      path: 'inbox',
      component: Inbox,
      onEnter(nextState, redirectTo) {
        expect(nextState.routes).toContain(InboxRoute);
        expect(redirectTo).toBeA('function');
      },
      onLeave(nextState, redirectTo) {
        expect(nextState.routes).toNotContain(InboxRoute);
        expect(redirectTo).toBeA('function');
      }
    };

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, redirectTo) {
        expect(nextState.routes).toContain(RedirectToInboxRoute);
        expect(redirectTo).toBeA('function');

        redirectTo('/inbox');
      },
      onLeave(nextState, redirectTo) {
        expect(nextState.routes).toNotContain(RedirectToInboxRoute);
        expect(redirectTo).toBeA('function');
      }
    };

    MessageRoute = {
      path: 'messages/:messageID',
      onEnter(nextState, redirectTo) {
        expect(nextState.routes).toContain(MessageRoute);
        expect(redirectTo).toBeA('function');
      },
      onLeave(nextState, redirectTo) {
        // We can't make this assertion when switching from /messages/123 => /messages/456
        //expect(nextState.routes).toNotContain(MessageRoute);
        expect(redirectTo).toBeA('function');
      }
    };
  
    DashboardRoute = {
      component: Dashboard,
      onEnter(nextState, redirectTo) {
        expect(nextState.routes).toContain(DashboardRoute);
        expect(redirectTo).toBeA('function');
      },
      onLeave(nextState, redirectTo) {
        expect(nextState.routes).toNotContain(DashboardRoute);
        expect(redirectTo).toBeA('function');
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
          this.transitionTo('/news');
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
          this.transitionTo('/messages/456');
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

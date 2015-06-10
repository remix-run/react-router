import expect, { spyOn } from 'expect';
import React, { render, createClass } from 'react';
import MemoryHistory from '../MemoryHistory';
import Router from '../Router';
import Route from '../Route';

function createHistory(path) {
  return new MemoryHistory(path);
}

describe('When a router enters a branch', function () {
  var div, Dashboard, NewsFeed, Inbox, DashboardRoute, NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, routes;
  beforeEach(function () {
    div = document.createElement('div');

    Dashboard = createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
            {this.props.children}
          </div>
        );
      }
    });
  
    NewsFeed = createClass({
      render() {
        return <div>News</div>;
      }
    });
  
    Inbox = createClass({
      render() {
        return <div>Inbox</div>;
      }
    });
  
    NewsFeedRoute = {
      path: 'news',
      component: NewsFeed,
      onEnter(nextState, router) {
        expect(nextState.branch).toContain(NewsFeedRoute);
        expect(router).toBeA(Router);
      },
      onLeave(nextState, router) {
        expect(nextState.branch).toNotContain(NewsFeedRoute);
        expect(router).toBeA(Router);
      }
    };
  
    InboxRoute = {
      path: 'inbox',
      component: Inbox,
      onEnter(nextState, router) {
        expect(nextState.branch).toContain(InboxRoute);
        expect(router).toBeA(Router);
      },
      onLeave(nextState, router) {
        expect(nextState.branch).toNotContain(InboxRoute);
        expect(router).toBeA(Router);
      }
    };

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, router) {
        expect(nextState.branch).toContain(RedirectToInboxRoute);
        expect(router).toBeA(Router);

        router.replaceWith('/inbox');
      },
      onLeave(nextState, router) {
        expect(nextState.branch).toNotContain(RedirectToInboxRoute);
        expect(router).toBeA(Router);
      }
    };

    MessageRoute = {
      path: 'messages/:messageID',
      onEnter(nextState, router) {
        expect(nextState.branch).toContain(MessageRoute);
        expect(router).toBeA(Router);
      },
      onLeave(nextState, router) {
        // We can't make this assertion when switching from /messages/123 => /messages/456
        //expect(nextState.branch).toNotContain(MessageRoute);
        expect(router).toBeA(Router);
      }
    };
  
    DashboardRoute = {
      component: Dashboard,
      onEnter(nextState, router) {
        expect(nextState.branch).toContain(DashboardRoute);
        expect(router).toBeA(Router);
      },
      onLeave(nextState, router) {
        expect(nextState.branch).toNotContain(DashboardRoute);
        expect(router).toBeA(Router);
      },
      childRoutes: [ NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute ]
    };

    routes = [
      DashboardRoute
    ];
  });
 
  it('calls the onEnter hooks of all routes in that branch', function (done) {
    var spies = [
      spyOn(DashboardRoute, 'onEnter').andCallThrough(),
      spyOn(NewsFeedRoute, 'onEnter').andCallThrough()
    ];

    render(<Router history={createHistory('/news')} children={routes}/>, div, function () {
      spies.forEach(function (spy) {
        expect(spy).toHaveBeenCalled();
      });
      done();
    });
  });

  describe('and one of the transition hooks navigates to another route', function () {
    it('immediately transitions to the new route', function (done) {
      var redirectRouteEnterSpy = spyOn(RedirectToInboxRoute, 'onEnter').andCallThrough();
      var redirectRouteLeaveSpy = spyOn(RedirectToInboxRoute, 'onLeave').andCallThrough();
      var inboxEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();

      render(<Router history={createHistory('/redirect-to-inbox')} children={routes}/>, div, function () {
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

      var steps = [];

      steps.push(function () {
        expect(inboxRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
        this.transitionTo('/news');
      });

      steps.push(function () {
        expect(inboxRouteLeaveSpy).toHaveBeenCalled('InboxRoute.onLeave was not called');
        expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
        done();
      });

      function execNextStep() {
        try {
          steps.shift().apply(this, arguments);
        } catch (error) {
          done(error);
        }
      }

      render(<Router history={createHistory('/inbox')} children={routes} onUpdate={execNextStep}/>, div, execNextStep);
    });
  });

  describe('and then navigates to the same branch, but with different params', function () {
    it('calls the onLeave and onEnter hooks of all routes whose params have changed', function (done) {
      var dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough();
      var dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough();
      var messageRouteLeaveSpy = spyOn(MessageRoute, 'onLeave').andCallThrough();
      var messageRouteEnterSpy = spyOn(MessageRoute, 'onEnter').andCallThrough();

      var steps = [];

      steps.push(function () {
        expect(dashboardRouteEnterSpy).toHaveBeenCalled('DashboardRoute.onEnter was not called');
        expect(messageRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
        this.transitionTo('/messages/456');
      });

      steps.push(function () {
        expect(messageRouteLeaveSpy).toHaveBeenCalled('MessageRoute.onLeave was not called');
        expect(messageRouteEnterSpy).toHaveBeenCalled('MessageRoute.onEnter was not called');
        expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
        done();
      });

      function execNextStep() {
        try {
          steps.shift().apply(this, arguments);
        } catch (error) {
          done(error);
        }
      }

      var history = new MemoryHistory('/messages/123');
      render(<Router history={history} children={routes} onUpdate={execNextStep}/>, div, execNextStep);
    });
  });
});


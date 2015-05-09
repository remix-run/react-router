var expect = require('expect');
var { spyOn } = expect;
var React = require('react');
var { render } = React;
var createRouter = require('../createRouter');
var History = require('../History');
var Route = require('../Route');

describe('When a router enters a branch', function () {
  var Router, Dashboard, NewsFeed, Inbox, DashboardRoute, NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, div;
  beforeEach(function () {
    div = document.createElement('div');

    Dashboard = React.createClass({
      statics: {
        routerWillEnter(router, nextState, route) {
          expect(router).toBeA(Router);
          expect(nextState.components).toContain(Dashboard);
          expect(route).toBe(DashboardRoute);
        },
        routerWillLeave(router, nextState, route) {
          expect(router).toBeA(Router);
          expect(router.state.components).toContain(Dashboard);
          expect(route).toBe(DashboardRoute);
        }
      },
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
      statics: {
        routerWillEnter(router, nextState, route) {
          expect(router).toBeA(Router);
          expect(nextState.components).toContain(NewsFeed);
          expect(route).toBe(NewsFeedRoute);
        },
        routerWillLeave(router, nextState, route) {
          expect(router).toBeA(Router);
          expect(router.state.components).toContain(NewsFeed);
          expect(route).toBe(NewsFeedRoute);
        }
      },
      render() {
        return <div>News</div>;
      }
    });
  
    Inbox = React.createClass({
      statics: {
        routerWillEnter(router, nextState, route) {
          expect(router).toBeA(Router);
          expect(nextState.components).toContain(Inbox);
          expect(route).toBe(InboxRoute);
        },
        routerWillLeave(router, nextState, route) {
          expect(router).toBeA(Router);
          expect(router.state.components).toContain(Inbox);
          expect(route).toBe(InboxRoute);
        }
      },
      render() {
        return <div>Inbox</div>;
      }
    });
  
    NewsFeedRoute = {
      path: 'news',
      component: NewsFeed,
      onEnter(router, nextState) {
        expect(router).toBeA(Router);
        expect(nextState.branch).toContain(NewsFeedRoute);
      },
      onLeave(router, nextState) {
        expect(router).toBeA(Router);
        expect(router.state.branch).toContain(NewsFeedRoute);
      }
    };
  
    InboxRoute = {
      path: 'inbox',
      component: Inbox,
      onEnter(router, nextState) {
        expect(router).toBeA(Router);
        expect(nextState.branch).toContain(InboxRoute);
      },
      onLeave(router, nextState) {
        expect(router).toBeA(Router);
        expect(router.state.branch).toContain(InboxRoute);
      }
    };

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(router, nextState) {
        expect(router).toBeA(Router);
        expect(nextState.branch).toContain(RedirectToInboxRoute);
        router.replaceWith('/inbox');
      },
      onLeave(router, nextState) {
        expect(router).toBeA(Router);
        expect(router.state.branch).toContain(RedirectToInboxRoute);
      }
    };

    MessageRoute = {
      path: 'messages/:messageID',
      onEnter(router, nextState) {
        expect(router).toBeA(Router);
        expect(nextState.branch).toContain(MessageRoute);
      },
      onLeave(router, nextState) {
        expect(router).toBeA(Router);
        expect(router.state.branch).toContain(MessageRoute);
      }
    };
  
    DashboardRoute = {
      component: Dashboard,
      onEnter(router, nextState) {
        expect(router).toBeA(Router);
        expect(nextState.branch).toContain(DashboardRoute);
      },
      onLeave(router, nextState) {
        expect(router).toBeA(Router);
        expect(router.state.branch).toContain(DashboardRoute);
      },
      childRoutes: [ NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute ]
    };
  
    Router = createRouter(
      DashboardRoute
    );
  });
 
  it('calls the onEnter hooks of all routes in that branch', function (done) {
    var spies = [
      spyOn(DashboardRoute, 'onEnter').andCallThrough(),
      spyOn(NewsFeedRoute, 'onEnter').andCallThrough()
    ];

    render(<Router history={new History('/news')}/>, div, function () {
      spies.forEach(function (spy) {
        expect(spy).toHaveBeenCalled();
      });
      done();
    });
  });

  it('calls the routerWillEnter hooks of all components in that branch', function (done) {
    var spies = [
      spyOn(Dashboard, 'routerWillEnter').andCallThrough(),
      spyOn(NewsFeed, 'routerWillEnter').andCallThrough()
    ];

    render(<Router history={new History('/news')}/>, div, function () {
      spies.forEach(function (spy) {
        expect(spy).toHaveBeenCalled();
      });
      done();
    });

    spies.forEach(function (spy) {
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('and one of the transition hooks navigates to another route', function () {
    it('immediately transitions to the new route', function (done) {
      var redirectRouteEnterSpy = spyOn(RedirectToInboxRoute, 'onEnter').andCallThrough();
      var redirectRouteLeaveSpy = spyOn(RedirectToInboxRoute, 'onLeave').andCallThrough();
      var inboxEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();

      var history = new History('/redirect-to-inbox');

      render(<Router history={history}/>, div, function () {
        expect(history.getPath()).toEqual('/inbox');
        expect(redirectRouteEnterSpy).toHaveBeenCalled();
        expect(redirectRouteLeaveSpy.calls.length).toEqual(0);
        expect(inboxEnterSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('and then navigates to another branch', function () {
    it('calls the onLeave/routerWillLeave hooks of all routes & components in the previous branch that are not in the next branch', function (done) {
      var dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough();
      var inboxRouteEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();
      var inboxRouteLeaveSpy = spyOn(InboxRoute, 'onLeave').andCallThrough();
      var dashboardComponentLeaveSpy = spyOn(Dashboard, 'routerWillLeave').andCallThrough();
      var inboxComponentEnterSpy = spyOn(Inbox, 'routerWillEnter').andCallThrough();
      var inboxComponentLeaveSpy = spyOn(Inbox, 'routerWillLeave').andCallThrough();

      var steps = [];

      steps.push(function () {
        try {
          expect(inboxRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
          expect(inboxComponentEnterSpy).toHaveBeenCalled('Inbox.routerWillEnter was not called');
          this.transitionTo('/news');
        } catch (error) {
          done(error);
        }
      });

      steps.push(function () {
        try {
          expect(inboxComponentLeaveSpy).toHaveBeenCalled('Inbox.routerWillLeave was not called');
          expect(inboxRouteLeaveSpy).toHaveBeenCalled('InboxRoute.onLeave was not called');
          expect(dashboardComponentLeaveSpy.calls.length).toEqual(0, 'Dashboard.routerWillLeave was called');
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
          done();
        } catch (error) {
          done(error);
        }
      });

      function execNextStep() {
        steps.shift().apply(this, arguments);
      }

      var history = new History('/inbox');
      render(<Router history={history} onUpdate={execNextStep}/>, div, execNextStep);
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
        try {
          expect(dashboardRouteEnterSpy).toHaveBeenCalled('DashboardRoute.onEnter was not called');
          expect(messageRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
          this.transitionTo('/messages/456');
        } catch (error) {
          done(error);
        }
      });

      steps.push(function () {
        try {
          expect(messageRouteLeaveSpy).toHaveBeenCalled('MessageRoute.onLeave was not called');
          expect(messageRouteEnterSpy).toHaveBeenCalled('MessageRoute.onEnter was not called');
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
          done();
        } catch (error) {
          done(error);
        }
      });

      function execNextStep() {
        steps.shift().apply(this, arguments);
      }

      var history = new History('/messages/123');
      render(<Router history={history} onUpdate={execNextStep}/>, div, execNextStep);
    });
  });
});


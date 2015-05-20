var expect = require('expect');
var React = require('react');
var createRouter = require('../createRouter');
var History = require('../History');
var Route = require('../Route');
var TransitionHook = require('../TransitionHook');

describe('TransitionHook', function () {
  it('calls routerWillLeave when the router leaves the current location', function (done) {
    var div = document.createElement('div');

    var hookCalled = false;

    var One = React.createClass({
      mixins: [ TransitionHook ],
      routerWillLeave () {
        hookCalled = true;
      },
      render () { return <div>one</div> }
    });

    var Two = React.createClass({
      render () { return <div>two</div> }
    });

    var Router = createRouter([
      <Route path="one" component={One}/>,
      <Route path="two" component={Two}/>
    ]);

    var history = new History('/one');

    var steps = [
      function () {
        expect(history.getPath()).toEqual('/one');
        expect(div.textContent.trim()).toEqual('one');
        this.transitionTo('/two')
      },
      function () {
        expect(hookCalled).toEqual(true);
        expect(history.getPath()).toEqual('/two');
        done();
      }
    ];

    function execNextStep() {
      steps.shift().apply(this, arguments);
    }

    React.render(<Router history={history} onUpdate={execNextStep}/>, div, execNextStep);
  });
});

  //describe('and one of the transition hooks navigates to another route', function () {
    //it('immediately transitions to the new route', function (done) {
      //var redirectRouteEnterSpy = spyOn(RedirectToInboxRoute, 'onEnter').andCallThrough();
      //var redirectRouteLeaveSpy = spyOn(RedirectToInboxRoute, 'onLeave').andCallThrough();
      //var inboxEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();

      //var history = new History('/redirect-to-inbox');

      //render(<Router history={history}/>, div, function () {
        //expect(history.getPath()).toEqual('/inbox');
        //expect(redirectRouteEnterSpy).toHaveBeenCalled();
        //expect(redirectRouteLeaveSpy.calls.length).toEqual(0);
        //expect(inboxEnterSpy).toHaveBeenCalled();
        //done();
      //});
    //});
  //});

  //describe('and then navigates to another branch', function () {
    //it('calls the onLeave hooks of all routes in the previous branch that are not in the next branch', function (done) {
      //var dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough();
      //var inboxRouteEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough();
      //var inboxRouteLeaveSpy = spyOn(InboxRoute, 'onLeave').andCallThrough();

      //var steps = [];

      //steps.push(function () {
        //try {
          //expect(inboxRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
          //this.transitionTo('/news');
        //} catch (error) {
          //done(error);
        //}
      //});

      //steps.push(function () {
        //try {
          //expect(inboxRouteLeaveSpy).toHaveBeenCalled('InboxRoute.onLeave was not called');
          //expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
          //done();
        //} catch (error) {
          //done(error);
        //}
      //});

      //function execNextStep() {
        //steps.shift().apply(this, arguments);
      //}

      //var history = new History('/inbox');
      //render(<Router history={history} onUpdate={execNextStep}/>, div, execNextStep);
    //});
  //});

  //describe('and then navigates to the same branch, but with different params', function () {
    //it('calls the onLeave and onEnter hooks of all routes whose params have changed', function (done) {
      //var dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough();
      //var dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough();
      //var messageRouteLeaveSpy = spyOn(MessageRoute, 'onLeave').andCallThrough();
      //var messageRouteEnterSpy = spyOn(MessageRoute, 'onEnter').andCallThrough();

      //var steps = [];

      //steps.push(function () {
        //try {
          //expect(dashboardRouteEnterSpy).toHaveBeenCalled('DashboardRoute.onEnter was not called');
          //expect(messageRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called');
          //this.transitionTo('/messages/456');
        //} catch (error) {
          //done(error);
        //}
      //});

      //steps.push(function () {
        //try {
          //expect(messageRouteLeaveSpy).toHaveBeenCalled('MessageRoute.onLeave was not called');
          //expect(messageRouteEnterSpy).toHaveBeenCalled('MessageRoute.onEnter was not called');
          //expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called');
          //done();
        //} catch (error) {
          //done(error);
        //}
      //});

      //function execNextStep() {
        //steps.shift().apply(this, arguments);
      //}

      //var history = new History('/messages/123');
      //render(<Router history={history} onUpdate={execNextStep}/>, div, execNextStep);
    //});
  //});
//});


var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var Route = require('../../components/Route');
var RouteContext = require('../RouteContext');

describe('RouteContext', function () {

  var App = React.createClass({
    mixins: [ RouteContext ],
    render: function () {
      return React.DOM.div();
    }
  });

  describe('getRouteByName', function () {
    describe('when the route exists', function () {
      var component, route;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App(null,
            route = Route({ name: 'home', handler: App })
          )
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('returns that route', function () {
        expect(component.getRouteByName('home')).toBe(route);
      });
    });

    describe('when no such route exists', function () {
      var component;
      beforeEach(function () {
        component = ReactTestUtils.renderIntoDocument(
          App(null,
            Route({ name: 'home', handler: App })
          )
        );
      });

      afterEach(function () {
        React.unmountComponentAtNode(component.getDOMNode());
      });

      it('returns null', function () {
        expect(component.getRouteByName('about')).toBe(null);
      });
    });
  });

  describe('when a <Route> has no name or path', function () {
    var component, route;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          route = Route({ handler: App })
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses / as its path', function () {
      expect(route.props.path).toEqual('/');
    });
  });

  describe('when a <Route> has a name but no path', function () {
    var component, route;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          route = Route({ name: 'home', handler: App })
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('uses /:name as its path', function () {
      expect(route.props.path).toEqual('/home');
    });
  });

  describe('when a nested <Route>\'s path does not begin with a /', function () {
    var component, childRoute;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          Route({ name: 'home', handler: App },
            childRoute = Route({ path: 'sub', handler: App })
          )
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('extends the parent path', function () {
      expect(childRoute.props.path).toEqual('/home/sub');
    });
  });

  describe('when a nested <Route>\'s path begins with a /', function () {
    var component, childRoute;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          Route({ name: 'home', handler: App },
            childRoute = Route({ path: '/sub', handler: App })
          )
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('does not extend the parent path', function () {
      expect(childRoute.props.path).toEqual('/sub');
    });
  });

});

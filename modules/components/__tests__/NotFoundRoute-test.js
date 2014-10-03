var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var RouteContainer = require('../../mixins/RouteContainer');
var Route = require('../Route');
var NotFoundRoute = require('../NotFoundRoute');

describe('NotFoundRoute', function () {
  it('has a null path', function () {
    expect(NotFoundRoute({ path: '/' }).props.path).toBe(null);
  });

  var App = React.createClass({
    mixins: [ RouteContainer ],
    render: function () {
      return React.DOM.div();
    }
  });

  describe('at the root of a container', function () {
    var component, route;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          route = NotFoundRoute({ handler: App })
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('becomes its container\'s notFoundRoute', function () {
      expect(component.props.notFoundRoute).toBe(route);
    });
  });

  describe('nested in another Route', function () {
    var component, route, notFoundRoute;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          route = Route({ handler: App },
            notFoundRoute = NotFoundRoute({ handler: App })
          )
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('becomes that route\'s notFoundRoute', function () {
      expect(route.props.notFoundRoute).toBe(notFoundRoute);
    });
  });
});

var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var RouteContainer = require('../../mixins/RouteContainer');
var Route = require('../Route');
var DefaultRoute = require('../DefaultRoute');

describe('A DefaultRoute', function () {
  it('has a null path', function () {
    expect(DefaultRoute({ path: '/' }).props.path).toBe(null);
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
          route = DefaultRoute({ handler: App })
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('becomes its container\'s defaultRoute', function () {
      expect(component.props.defaultRoute).toBe(route);
    });
  });

  describe('nested in another Route', function () {
    var component, route, defaultRoute;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        App(null,
          route = Route({ handler: App },
            defaultRoute = DefaultRoute({ handler: App })
          )
        )
      );
    });

    afterEach(function () {
      React.unmountComponentAtNode(component.getDOMNode());
    });

    it('becomes that route\'s defaultRoute', function () {
      expect(route.props.defaultRoute).toBe(defaultRoute);
    });
  });
});

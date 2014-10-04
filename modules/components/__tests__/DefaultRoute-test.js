var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var RouteContainer = require('../../mixins/RouteContainer');
var TransitionHandler = require('../../mixins/TransitionHandler');
var PathStore = require('../../stores/PathStore');
var Route = require('../Route');
var DefaultRoute = require('../DefaultRoute');

afterEach(function () {
  // For some reason unmountComponentAtNode doesn't call componentWillUnmount :/
  PathStore.removeAllChangeListeners();
});

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

describe('when no child routes match a URL, but the parent\'s path matches', function () {
  var App = React.createClass({
    mixins: [ TransitionHandler ],
    render: function () {
      return React.DOM.div();
    }
  });

  var component, rootRoute, defaultRoute;
  beforeEach(function () {
    component = ReactTestUtils.renderIntoDocument(
      App({ location: 'none' },
        rootRoute = Route({ name: 'user', path: '/users/:id', handler: App },
          Route({ name: 'home', path: '/users/:id/home', handler: App }),
          // Make it the middle sibling to test order independence.
          defaultRoute = DefaultRoute({ handler: App }),
          Route({ name: 'news', path: '/users/:id/news', handler: App })
        )
      )
    )
  });

  afterEach(function () {
    React.unmountComponentAtNode(component.getDOMNode());
  });

  it('matches the default route', function () {
    var matches = component.match('/users/5');
    assert(matches);
    expect(matches.length).toEqual(2);
    expect(matches[0].route).toBe(rootRoute);
    expect(matches[1].route).toBe(defaultRoute);
  });
});

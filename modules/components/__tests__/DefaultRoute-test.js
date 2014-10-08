var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var DefaultRoute = require('../DefaultRoute');
var Routes = require('../Routes');
var Route = require('../Route');

var NullHandler = React.createClass({
  render: function () {
    return null;
  }
});

afterEach(require('../../stores/PathStore').teardown);

describe('A DefaultRoute', function () {

  it('has a null path', function () {
    expect(DefaultRoute({ path: '/' }).props.path).toBe(null);
  });

  describe('at the root of a container', function () {
    var component, route;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes({ location: 'none' },
          route = DefaultRoute({ handler: NullHandler })
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
        Routes({ location: 'none' },
          route = Route({ handler: NullHandler },
            defaultRoute = DefaultRoute({ handler: NullHandler })
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

  var component, rootRoute, defaultRoute;
  beforeEach(function (done) {
    component = ReactTestUtils.renderIntoDocument(
      Routes({ location: 'none' },
        rootRoute = Route({ name: 'user', path: '/users/:id', handler: NullHandler },
          Route({ name: 'home', path: '/users/:id/home', handler: NullHandler }),
          // Make it the middle sibling to test order independence.
          defaultRoute = DefaultRoute({ handler: NullHandler }),
          Route({ name: 'news', path: '/users/:id/news', handler: NullHandler })
        )
      )
    );

    component.dispatch('/users/5', done);
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

var assert = require('assert');
var expect = require('expect');
var React = require('react/addons');
var ReactTestUtils = React.addons.TestUtils;
var NotFoundRoute = require('../NotFoundRoute');
var Routes = require('../Routes');
var Route = require('../Route');

var NullHandler = React.createClass({
  render: function () {
    return null;
  }
});

describe('A NotFoundRoute', function () {

  it('has a null path', function () {
    expect(NotFoundRoute({ path: '/' }).props.path).toBe(null);
  });

  describe('at the root of a container', function () {
    var component, route;
    beforeEach(function () {
      component = ReactTestUtils.renderIntoDocument(
        Routes({ location: 'none' },
          route = NotFoundRoute({ handler: NullHandler })
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
        Routes({ location: 'none' },
          route = Route({ handler: NullHandler },
            notFoundRoute = NotFoundRoute({ handler: NullHandler })
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

describe('when no child routes match a URL, but the beginning of the parent\'s path matches', function () {

  var component, rootRoute, notFoundRoute;
  beforeEach(function (done) {
    component = ReactTestUtils.renderIntoDocument(
      Routes({ location: 'none' },
        rootRoute = Route({ name: 'user', path: '/users/:id', handler: NullHandler },
          Route({ name: 'home', path: '/users/:id/home', handler: NullHandler }),
          // Make it the middle sibling to test order independence.
          notFoundRoute = NotFoundRoute({ handler: NullHandler }),
          Route({ name: 'news', path: '/users/:id/news', handler: NullHandler })
        )
      )
    );

    component.dispatch('/users/5', done);
  });

  afterEach(function () {
    React.unmountComponentAtNode(component.getDOMNode());
  });

  it('matches the NotFoundRoute', function () {
    var matches = component.match('/users/5/not-found');
    assert(matches);
    expect(matches.length).toEqual(2);
    expect(matches[0].route).toBe(rootRoute);
    expect(matches[1].route).toBe(notFoundRoute);
  });

});

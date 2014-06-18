require('./helper');
var Route = require('../lib/Route');
var RouteComponent = require('../lib/components/Route');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('a Route with a named handler', function () {
  var route;
  beforeEach(function () {
    route = new Route({ handler: App });
  });

  it('has the correct displayName', function () {
    expect(route.displayName).toEqual('AppRoute');
  });

  it('has the correct toString representation', function () {
    expect(route + '').toEqual('<AppRoute>');
  });
});

describe('a Route without a handler component', function () {
  it('throws an Error', function () {
    expect(function () {
      new Route({ handler: null });
    }).toThrow(Error);
  });
});

describe('a Route with no path', function () {
  describe('or a name', function () {
    it('uses / as its path', function () {
      var route = new Route({ handler: App });
      expect(route.path).toEqual('/');
    });
  });

  describe('and a name', function () {
    it('uses its name as its path', function () {
      var route = new Route({ name: 'users', handler: App });
      expect(route.path).toEqual('/users');
    });
  });
});

describe('a Route that is missing a parameter that its parent Route needs', function () {
  it('throws an Error', function () {
    expect(function () {
      Route.fromComponent(
        RouteComponent({ path: '/users/:userId', handler: App },
          RouteComponent({ path: '/users/:id/comments', handler: App })
        )
      );
    }).toThrow(/missing the "userId" parameter/);
  });
});

require('./helper');
var RouteStore = require('../modules/stores/RouteStore');
var Route = require('../modules/components/Route');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('when a route with a given name is not present', function () {
  it('returns null', function () {
    expect(RouteStore.getRouteByName('products')).toBe(null);
  });
});

describe('when a route is looked up by name', function () {
  var route;
  beforeEach(function () {
    route = Route({ name: 'products', handler: App });
    RouteStore.registerRoute(route);
  });

  it('returns that route', function () {
    expect(RouteStore.getRouteByName('products')).toEqual(route);
  });
});

describe('when registering a route', function () {
  describe('with no handler', function () {
    it('throws an Error', function () {
      expect(function () {
        RouteStore.registerRoute(Route());
      }).toThrow(Error);
    });
  });

  describe('with no path or name', function () {
    it('uses / as its path', function () {
      var route = Route({ handler: App });
      RouteStore.registerRoute(route);
      expect(route.props.path).toEqual('/');
      RouteStore.unregisterRoute(route);
    });
  });

  describe('with a name but no path', function () {
    it('uses its name as its path', function () {
      var route = Route({ name: 'users', handler: App });
      RouteStore.registerRoute(route);
      expect(route.props.path).toEqual('/users');
      RouteStore.unregisterRoute(route);
    });
  });

  describe('with the same name as another route', function () {
    beforeEach(function () {
      RouteStore.registerRoute(Route({ name: 'users', handler: App }));
    });

    it('throws an error', function () {
      expect(function () {
        RouteStore.registerRoute(Route({ name: 'users', handler: App }));
      }).toThrow(Error);
    });
  });

  describe('that is missing a parameter its parent route needs', function () {
    it('throws an error', function () {
      expect(function () {
        var childRoute;
        var route = Route({ path: '/users/:userID' },
          childRoute = Route({ path: '/users/:id/comments '})
        );
        RouteStore.registerRoute(childRoute);
      }).toThrow(Error);
    });
  });
});

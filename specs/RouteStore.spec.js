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

  afterEach(function () {
    RouteStore.unregisterRoute(route);
  });

  it('returns that route', function () {
    expect(RouteStore.getRouteByName('products')).toEqual(route);
  });
});

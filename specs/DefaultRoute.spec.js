require('./helper');
var RouteStore = require('../modules/stores/RouteStore');
var DefaultRoute = require('../modules/components/DefaultRoute');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('when registering a DefaultRoute', function () {
  describe('nested inside a Route component', function () {
    it('becomes that Route\'s defaultRoute', function () {
      var defaultRoute;
      var route = Route({ handler: App },
        defaultRoute = DefaultRoute({ handler: App })
      );

      RouteStore.registerRoute(route);
      expect(route.props.defaultRoute).toBe(defaultRoute);
      RouteStore.unregisterRoute(route);
    });
  });

  describe('nested inside a Routes component', function () {
    it('becomes that Routes\' defaultRoute', function () {
      var defaultRoute;
      var routes = Routes({ handler: App },
        defaultRoute = DefaultRoute({ handler: App })
      );

      RouteStore.registerRoute(defaultRoute, routes);
      expect(routes.props.defaultRoute).toBe(defaultRoute);
      RouteStore.unregisterRoute(defaultRoute);
    });
  });
});

describe('when no child routes match a URL, but the parent matches', function () {
  it('matches the default route', function () {
    var defaultRoute;
    var routes = ReactTestUtils.renderIntoDocument(
      Routes(null,
        Route({ name: 'user', path: '/users/:id', handler: App },
          Route({ name: 'home', path: '/users/:id/home', handler: App }),
          // Make it the middle sibling to test order independence.
          defaultRoute = DefaultRoute({ handler: App }),
          Route({ name: 'news', path: '/users/:id/news', handler: App })
        )
      )
    );

    var matches = routes.match('/users/5');
    assert(matches);
    expect(matches.length).toEqual(2);

    expect(matches[1].route).toBe(defaultRoute);

    expect(matches[0].route.props.name).toEqual('user');
  });
});

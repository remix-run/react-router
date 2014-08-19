require('./helper');
var RouteStore = require('../modules/stores/RouteStore');
var NotFoundRoute = require('../modules/components/NotFoundRoute');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('when registering a NotFoundRoute', function () {
  describe('nested inside a Route component', function () {
    it('becomes that Route\'s notFoundRoute', function () {
      var notFoundRoute;
      var route = Route({ handler: App },
        notFoundRoute = NotFoundRoute({ handler: App })
      );

      RouteStore.registerRoute(route);
      expect(route.props.notFoundRoute).toBe(notFoundRoute);
      RouteStore.unregisterRoute(route);
    });
  });

  describe('nested inside a Routes component', function () {
    it('becomes that Routes\' notFoundRoute', function () {
      var notFoundRoute;
      var routes = Routes({ handler: App },
        notFoundRoute = NotFoundRoute({ handler: App })
      );

      RouteStore.registerRoute(notFoundRoute, routes);
      expect(routes.props.notFoundRoute).toBe(notFoundRoute);
      RouteStore.unregisterRoute(notFoundRoute);
    });
  });
});

describe('when no child routes match a URL, but the beginning of the parent\'s path matches', function () {
  it('matches the default route', function () {
    var notFoundRoute;
    var routes = ReactTestUtils.renderIntoDocument(
      Routes(null,
        Route({ name: 'user', path: '/users/:id', handler: App },
          Route({ name: 'home', path: '/users/:id/home', handler: App }),
          // Make it the middle sibling to test order independence.
          notFoundRoute = NotFoundRoute({ handler: App }),
          Route({ name: 'news', path: '/users/:id/news', handler: App })
        )
      )
    );

    var matches = routes.match('/users/5/not-found');
    assert(matches);
    expect(matches.length).toEqual(2);

    expect(matches[1].route).toBe(notFoundRoute);

    expect(matches[0].route.props.name).toEqual('user');
  });
});

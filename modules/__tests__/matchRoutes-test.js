import assert from 'assert';
import expect from 'expect';
import { createLocation } from 'history';
import matchRoutes from '../matchRoutes';

describe.skip('matchRoutes', function () {
  var routes, RootRoute, UsersRoute, UsersIndexRoute, UserRoute, AboutRoute, TeamRoute, ProfileRoute;
  beforeEach(function () {
    /*
    <Route>
      <Route path="users">
        <Index />
        <Route path=":userID">
          <Route path="/profile" />
        </Route>
        <Route path="/team" />
      </Route>
    </Route>
    <Route path="/about" />
    */
    routes = [
      RootRoute = {
        childRoutes: [
          UsersRoute = {
            path: 'users',
            indexRoute: (UsersIndexRoute = {}),
            childRoutes: [
              UserRoute = {
                path: ':userID',
                childRoutes: [
                  ProfileRoute = {
                    path: '/profile'
                  }
                ]
              },
              TeamRoute = {
                path: '/team'
              }
            ]
          }
        ]
      },
      AboutRoute = {
        path: '/about'
      }
    ];
  });

  function describeRoutes() {
    describe('when the location matches an index route', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/users'), function (error, match) {
          assert(match);
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UsersIndexRoute ]);
          done();
        });
      });
    });

    describe('when the location matches a nested route with params', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/users/5'), function (error, match) {
          assert(match);
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UserRoute ]);
          expect(match.params).toEqual({ userID: '5' });
          done();
        });
      });
    });

    describe('when the location matches an absolute route', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/about'), function (error, match) {
          assert(match);
          expect(match.routes).toEqual([ AboutRoute ]);
          done();
        });
      });
    });
  }

  describe('a synchronous route config', function () {
    describeRoutes();

    describe('when the location matches a nested absolute route', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/team'), function (error, match) {
          assert(match);
          expect(match.routes).toEqual([ RootRoute, UsersRoute, TeamRoute ]);
          done();
        });
      });
    });

    describe('when the location matches an absolute route nested under a route with params', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/profile'), function (error, match) {
          assert(match);
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UserRoute, ProfileRoute ]);
          expect(match.params).toEqual({ userID: null });
          done();
        });
      });
    });
  });

  describe('an asynchronous route config', function () {
    function makeAsyncRouteConfig(routes) {
      routes.forEach(function (route) {
        var { childRoutes, indexRoute } = route;

        if (childRoutes) {
          delete route.childRoutes;

          route.getChildRoutes = function (location, callback) {
            setTimeout(function () {
              callback(null, childRoutes);
            });
          };

          makeAsyncRouteConfig(childRoutes);
        }

        if (indexRoute) {
          delete route.indexRoute;

          route.getIndexRoute = function (location, callback) {
            setTimeout(function () {
              callback(null, indexRoute);
            });
          };
        }
      });
    }

    beforeEach(function () {
      makeAsyncRouteConfig(routes);
    });

    describeRoutes();
  });
});

import expect from 'expect'
import React from 'react'
import { createMemoryHistory } from 'history'
import { createRoutes } from '../RouteUtils'
import matchRoutes from '../matchRoutes'
import Route from '../Route'
import IndexRoute from '../IndexRoute'
import shouldWarn from './shouldWarn'

describe('matchRoutes', function () {
  let routes
  let
    RootRoute, UsersRoute, UsersIndexRoute, UserRoute, PostRoute, FilesRoute,
    AboutRoute, TeamRoute, ProfileRoute, GreedyRoute, OptionalRoute,
    OptionalRouteChild, CatchAllRoute
  let createLocation = createMemoryHistory().createLocation

  beforeEach(function () {
    /*
    <Route>
      <Route path="users">
        <IndexRoute />
        <Route path=":userID">
          <Route path="/profile" />
        </Route>
        <Route path="/team" />
      </Route>
    </Route>
    <Route path="/about" />
    <Route path="/(optional)">
      <Route path="child" />
    </Route>
    <Route path="*" />
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
                  },
                  PostRoute = {
                    path: ':postID'
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
      FilesRoute = {
        path: '/files/*/*.jpg'
      },
      AboutRoute = {
        path: '/about'
      },
      GreedyRoute = {
        path: '/**/f'
      },
      OptionalRoute = {
        path: '/(optional)',
        childRoutes: [
          OptionalRouteChild = {
            path: 'child'
          }
        ]
      },
      CatchAllRoute = {
        path: '*'
      }
    ]
  })

  function describeRoutes() {
    describe('when the location matches an index route', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/users'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UsersIndexRoute ])
          done()
        })
      })
    })

    describe('when the location matches a nested route with params', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/users/5'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UserRoute ])
          expect(match.params).toEqual({ userID: '5' })
          done()
        })
      })
    })

    describe('when the location matches a deeply nested route with params', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/users/5/abc'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UserRoute, PostRoute ])
          expect(match.params).toEqual({ userID: '5', postID: 'abc' })
          done()
        })
      })
    })

    describe('when the location matches a nested route with multiple splat params', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/files/a/b/c.jpg'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ FilesRoute ])
          expect(match.params).toEqual({ splat: [ 'a', 'b/c' ] })
          done()
        })
      })
    })

    describe('when the location matches a nested route with a greedy splat param', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/foo/bar/f'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ GreedyRoute ])
          expect(match.params).toEqual({ splat: 'foo/bar' })
          done()
        })
      })
    })

    describe('when the location matches a route with hash', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/users#about'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UsersIndexRoute ])
          done()
        })
      })
    })

    describe('when the location matches a deeply nested route with params and hash', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/users/5/abc#about'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UserRoute, PostRoute ])
          expect(match.params).toEqual({ userID: '5', postID: 'abc' })
          done()
        })
      })
    })

    describe('when the location matches an absolute route', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/about'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ AboutRoute ])
          done()
        })
      })
    })

    describe('when the location matches an optional route', function () {
      it('matches when the optional pattern is missing', function (done) {
        matchRoutes(routes, createLocation('/'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ OptionalRoute ])
          done()
        })
      })

      it('matches when the optional pattern is present', function (done) {
        matchRoutes(routes, createLocation('/optional'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ OptionalRoute ])
          done()
        })
      })
    })

    describe('when the location matches the child of an optional route', function () {
      it('matches when the optional pattern is missing', function (done) {
        matchRoutes(routes, createLocation('/child'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ OptionalRoute, OptionalRouteChild ])
          done()
        })
      })

      it('matches when the optional pattern is present', function (done) {
        matchRoutes(routes, createLocation('/optional/child'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ OptionalRoute, OptionalRouteChild ])
          done()
        })
      })
    })

    describe('when the location does not match any routes', function () {
      it('matches the "catch-all" route', function (done) {
        matchRoutes(routes, createLocation('/not-found'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ CatchAllRoute ])
          done()
        })
      })

      it('matches the "catch-all" route on a deep miss', function (done) {
        matchRoutes(routes, createLocation('/not-found/foo'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ CatchAllRoute ])
          done()
        })
      })

      it('matches the "catch-all" route on missing path separators', function (done) {
        matchRoutes(routes, createLocation('/optionalchild'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ CatchAllRoute ])
          done()
        })
      })
    })
  }

  describe('a synchronous route config', function () {
    describeRoutes()

    describe('when the location matches a nested absolute route', function () {
      it('matches the correct routes', function (done) {
        matchRoutes(routes, createLocation('/team'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, TeamRoute ])
          done()
        })
      })
    })

    describe('when the location matches an absolute route nested under a route with params', function () {
      it('matches the correct routes and params', function (done) {
        matchRoutes(routes, createLocation('/profile'), function (error, match) {
          expect(match).toExist()
          expect(match.routes).toEqual([ RootRoute, UsersRoute, UserRoute, ProfileRoute ])
          expect(match.params).toEqual({}) // no userID param
          done()
        })
      })
    })
  })

  describe('an asynchronous route config', function () {
    function makeAsyncRouteConfig(routes) {
      routes.forEach(function (route) {
        const { childRoutes, indexRoute } = route

        if (childRoutes) {
          delete route.childRoutes

          route.getChildRoutes = function (location, callback) {
            setTimeout(function () {
              callback(null, childRoutes)
            })
          }

          makeAsyncRouteConfig(childRoutes)
        }

        if (indexRoute) {
          delete route.indexRoute

          route.getIndexRoute = function (location, callback) {
            setTimeout(function () {
              callback(null, indexRoute)
            })
          }
        }
      })
    }

    beforeEach(function () {
      makeAsyncRouteConfig(routes)
    })

    describeRoutes()
  })

  describe('an asynchronous JSX route config', function () {
    let getChildRoutes, getIndexRoute, jsxRoutes

    beforeEach(function () {
      getChildRoutes = function (location, callback) {
        setTimeout(function () {
          callback(null, <Route path=":userID" />)
        })
      }

      getIndexRoute = function (location, callback) {
        setTimeout(function () {
          callback(null, <Route name="jsx" />)
        })
      }

      jsxRoutes = createRoutes([
        <Route name="users"
               path="users"
               getChildRoutes={getChildRoutes}
               getIndexRoute={getIndexRoute} />
      ])
    })

    it('when getChildRoutes callback returns reactElements', function (done) {
      matchRoutes(jsxRoutes, createLocation('/users/5'), function (error, match) {
        expect(match).toExist()
        expect(match.routes.map(r => r.path)).toEqual([ 'users', ':userID' ])
        expect(match.params).toEqual({ userID: '5' })
        done()
      })
    })

    it('when getIndexRoute callback returns reactElements', function (done) {
      matchRoutes(jsxRoutes, createLocation('/users'), function (error, match) {
        expect(match).toExist()
        expect(match.routes.map(r => r.name)).toEqual([ 'users', 'jsx' ])
        done()
      })
    })
  })

  it('complains about invalid index route with path', function (done) {
    shouldWarn('path')

    const invalidRoutes = createRoutes(
      <Route path="/">
        <IndexRoute path="foo" />
      </Route>
    )

    matchRoutes(invalidRoutes, createLocation('/'), function (error, match) {
      expect(match).toExist()
      done()
    })
  })

  it('supports splat under pathless route at root', function (done) {
    const routes = createRoutes(
      <Route>
        <Route path="*" />
      </Route>
    )

    matchRoutes(routes, createLocation('/'), function (error, match) {
      expect(match).toExist()
      done()
    })
  })
})

import expect, { spyOn } from 'expect';
import { parseQueryString } from '../URLUtils';
import { getProps } from '../RoutingUtils';

describe('getProps', function () {
  var RootRoute, AboutRoute, CoursesRoute, GradesRoute, CourseRoute, CourseGradesRoute, AssignmentRoute, AssignmentsRoute, CatchAllRoute, AccountRoute, AccountIndexRoute, ProfileRoute, ProfileIndexRoute;
  beforeEach(function () {
    AboutRoute = {
      path: 'about'
    };

    GradesRoute = {
      path: 'grades'
    };

    CoursesRoute = {
      path: 'courses',
      getChildRoutes(callback) {
        callback(null, [ GradesRoute ]);
      }
    };

    CourseGradesRoute = {
      path: 'grades'
    };

    AssignmentRoute = {
      path: 'assignments/:assignmentID'
    };

    AssignmentsRoute = {
      path: 'assignments'
    };

    CourseRoute = {
      getChildRoutes(callback) {
        setTimeout(function () {
          callback(null, [ CourseGradesRoute, AssignmentRoute, AssignmentsRoute ]);
        }, 0);
      }
    };

    AccountIndexRoute = {};

    AccountRoute = {
      path: 'account',
      indexRoute: AccountIndexRoute
    };

    ProfileIndexRoute = {};

    ProfileRoute = {
      path: 'profile',
      getIndexRoute (cb) {
        cb(null, ProfileIndexRoute);
      }
    };

    CatchAllRoute = {
      path: '*'
    };

    RootRoute = {
      childRoutes: [ AboutRoute, CoursesRoute, CourseRoute, AccountRoute, ProfileRoute, CatchAllRoute ]
    };
  });

  describe('when the path does not props any route', function () {
    it('matches the "catch all" route', function (done) {
      getProps(RootRoute, '/not-found', parseQueryString, function (error, props) {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute, CatchAllRoute ]);
        done();
      });
    });
  });

  describe('when the path matches a route exactly', function () {
    it('matches', function (done) {
      getProps(RootRoute, '/', parseQueryString, function (error, props) {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute ]);
        done();
      });
    });
  });

  describe('when the path matches a nested route exactly', function () {
    it('matches', function (done) {
      getProps(RootRoute, '/courses', parseQueryString, function (error, props) {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute, CoursesRoute ]);
        done();
      });
    });

    it('does not attempt to fetch the nested route\'s child routes', function (done) {
      var spy = spyOn(CoursesRoute, 'getChildRoutes');

      getProps(RootRoute, '/courses', parseQueryString, function () {
        expect(spy.calls.length).toEqual(0);
        done();
      });
    });

    describe('with an index route', function () {
      it('matches synchronously', function (done) {
        getProps(RootRoute, '/account', parseQueryString, function (error, props) {
          expect(props.branch).toEqual([ RootRoute, AccountRoute, AccountIndexRoute]);
          done();
        });
      });

      it('matches asynchronously', function (done) {
        getProps(RootRoute, '/profile', parseQueryString, function (error, props) {
          expect(props.branch).toEqual([ RootRoute, ProfileRoute, ProfileIndexRoute]);
          done();
        });
      });
    });
  });

  describe('when the path matches a nested route with a trailing slash', function () {
    it('matches', function (done) {
      getProps(RootRoute, '/courses/', parseQueryString, function (error, props) {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute, CoursesRoute ]);
        done();
      });
    });

    it('does not attempt to fetch the nested route\'s child routes', function (done) {
      var spy = spyOn(CoursesRoute, 'getChildRoutes');

      getProps(RootRoute, '/courses/', parseQueryString, function () {
        expect(spy.calls.length).toEqual(0);
        done();
      });
    });
  });

  describe('when the path matches a deeply nested route', function () {
    it('matches', function (done) {
      getProps(RootRoute, '/courses/grades', parseQueryString, function (error, props) {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute, CoursesRoute, GradesRoute ]);
        done();
      });
    });

    it('fetches the nested route\'s child routes', function (done) {
      var spy = spyOn(CoursesRoute, 'getChildRoutes').andCallThrough();

      getProps(RootRoute, '/courses/grades', parseQueryString, function () {
        expect(spy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('when the path matches a route with a dynamic segment', function () {
    it('stores the value of that segment in params', function (done) {
      getProps(RootRoute, '/assignments/abc', parseQueryString, function (error, props) {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute, CourseRoute, AssignmentRoute ]);
        expect(props.params).toEqual({ assignmentID: 'abc' });
        done();
      });
    });
  });

  describe('when nested routes are able to be fetched synchronously', function () {
    it('matches synchronously', function () {
      var error, props;

      getProps(RootRoute, '/courses/grades', parseQueryString, function (innerError, innerProps) {
        error = innerError;
        props = innerProps;
      });

      expect(error).toNotExist();
      expect(props).toBeAn('object');
      expect(props.branch).toEqual([ RootRoute, CoursesRoute, GradesRoute ]);
    });
  });

  describe('when nested routes must be fetched asynchronously', function () {
    it('matches asynchronously', function (done) {
      var outerError, outerProps;

      getProps(RootRoute, '/assignments', parseQueryString, function (error, props) {
        outerError = error;
        outerProps = props;

        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.branch).toEqual([ RootRoute, CourseRoute, AssignmentsRoute ]);
        done();
      });

      expect(outerError).toNotExist();
      expect(outerProps).toNotExist();
    });
  });
});

describe('Matching params', function () {
  function assertParams(routes, pathname, params, callback) {
    if (typeof routes === 'string')
      routes = [ { path: routes } ];

    getProps(routes, pathname, parseQueryString, function (error, props) {
      try {
        expect(error).toNotExist();
        expect(props).toBeAn('object');
        expect(props.params).toEqual(params);
        callback();
      } catch (error) {
        callback(error);
      }
    });
  }

  describe('when a pattern does not have dynamic segments', function () {
    var pattern = 'about/us';

    describe('and the path matches', function () {
      it('returns an empty object', function (done) {
        assertParams(pattern, '/about/us', {}, done);
      });
    });
  });

  describe('when a pattern has dynamic segments', function () {
    var pattern = 'comments/:id.:ext/edit';

    describe('and the path matches', function () {
      it('returns an object with the params', function (done) {
        assertParams(pattern, 'comments/abc.js/edit', { id: 'abc', ext: 'js' }, done);
      });
    });

    describe('and the pattern is optional', function () {
      var pattern = 'comments/(:id)/edit';

      describe('and the path matches with supplied param', function () {
        it('returns an object with the params', function (done) {
          assertParams(pattern, 'comments/123/edit', { id: '123' }, done);
        });
      });

      describe('and the path matches without supplied param', function () {
        it('returns an object with an undefined param', function (done) {
          assertParams(pattern, 'comments//edit', { id: undefined }, done);
        });
      });
    });

    describe('and the pattern and forward slash are optional', function () {
      var pattern = 'comments(/:id)/edit';

      describe('and the path matches with supplied param', function () {
        it('returns an object with the params', function (done) {
          assertParams(pattern, 'comments/123/edit', { id: '123' }, done);
        });
      });

      describe('and the path matches without supplied param', function () {
        it('returns an object with an undefined param', function (done) {
          assertParams(pattern, 'comments/edit', { id: undefined }, done);
        });
      });
    });

    describe('and the path matches with a segment containing a .', function () {
      it('returns an object with the params', function (done) {
        assertParams(pattern, 'comments/foo.bar/edit', { id: 'foo', ext: 'bar' }, done);
      });
    });
  });

  describe('when a pattern has characters that have special URL encoding', function () {
    var pattern = 'one, two';

    describe('and the path matches', function () {
      it('returns an empty object', function (done) {
        assertParams(pattern, 'one, two', {}, done);
      });
    });
  });

  describe('when a pattern has dynamic segments and characters that have special URL encoding', function () {
    var pattern = '/comments/:id/edit now';

    describe('and the path matches', function () {
      it('returns an object with the params', function (done) {
        assertParams(pattern, '/comments/abc/edit now', { id: 'abc' }, done);
      });
    });
  });

  describe('when a pattern has a *', function () {
    describe('and the path has a single extension', function () {
      it('matches', function (done) {
        assertParams('/files/*', '/files/my/photo.jpg', { splat: 'my/photo.jpg' }, done);
      });
    });

    describe('and the path has multiple extensions', function () {
      it('matches', function (done) {
        assertParams('/files/*', '/files/my/photo.jpg.zip', { splat: 'my/photo.jpg.zip' }, done);
      });
    });

    describe('and an extension', function () {
      it('matches', function (done) {
        assertParams('/files/*.jpg', '/files/my/photo.jpg', { splat: 'my/photo' }, done);
      });
    });
  });

  describe('when a pattern has an optional group', function () {
    var pattern = '/archive(/:name)';

    describe('and the path contains a param for that group', function () {
      it('matches', function (done) {
        assertParams(pattern, '/archive/foo', { name: 'foo' }, done);
      });
    });

    describe('and the path does not contain a param for that group', function () {
      it('matches', function (done) {
        assertParams(pattern, '/archive', { name: undefined }, done);
      });
    });
  });

  describe('when a pattern contains dynamic segments', function () {
    var pattern = '/:query/with/:domain';

    describe('and the first param contains a dot', function () {
      it('matches', function (done) {
        assertParams(pattern, '/foo.ap/with/foo', { query: 'foo.ap', domain: 'foo' }, done);
      });
    });

    describe('and the second param contains a dot', function () {
      it('matches', function (done) {
        assertParams(pattern, '/foo/with/foo.app', { query: 'foo', domain: 'foo.app' }, done);
      });
    });

    describe('and both params contain a dot', function () {
      it('matches', function (done) {
        assertParams(pattern, '/foo.ap/with/foo.app', { query: 'foo.ap', domain: 'foo.app' }, done);
      });
    });
  });
});

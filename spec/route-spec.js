require('./helper');
var Route = require('../lib/route');

var App = React.createClass({
  render: function () {
    return React.DOM.div();
  }
});

describe('when a route pattern matches the URL', function () {
  it('route.match returns an array with that route', function () {
    var route = Route('/a/b/c', App);

    var match = route.match('a/b/c');
    expect(match.length).toEqual(1);

    var rootMatch = lastItem(match);
    expect(rootMatch.route).toBe(route);
    expect(rootMatch.params).toEqual({});
  });

  describe('and it contains dynamic segments', function () {
    it('route.match returns an array with that route and its params', function () {
      var route = Route('/posts/:id/edit', App);

      var match = route.match('posts/abc/edit');
      expect(match.length).toEqual(1);

      var rootMatch = lastItem(match);
      expect(rootMatch.route).toBe(route);
      expect(rootMatch.params).toEqual({ id: 'abc' });
    });
  });
});

describe('when a nested route matches the URL', function () {
  describe('and it has all the dynamic segments of its ancestors', function () {
    it('returns the appropriate params for each match', function () {
      var nestedRoute;
      var route = Route('/posts/:id', App, function (route) {
        nestedRoute = route('/posts/:id/comments/:commentId', App);
      });

      var match = route.match('posts/abc/comments/123');
      expect(match.length).toEqual(2);

      var rootMatch = lastItem(match);
      expect(rootMatch.route).toBe(nestedRoute);
      expect(rootMatch.params).toEqual({ id: 'abc', commentId: '123' });

      var firstMatch = match[0];
      expect(firstMatch.route).toBe(route);
      expect(firstMatch.params).toEqual({ id: 'abc' });
    });
  });

  describe('but it is missing some dynamic segments of its ancestors', function () {
    it('route.match throws an Error', function () {
      var route = Route('/comments/:id', App, function (route) {
        route('/comments/:commentId/edit', App);
      });

      expect(function () {
        route.match('comments/abc/edit');
      }).toThrow(Error);
    });
  });
});

describe('when multiple nested routes match the URL', function () {
  it('route.match returns the first one in the subtree, depth-first', function () {
    var expectedRoute;

    var route = Route('/', App, function (route) {
      route('/a', App, function (route) {
        expectedRoute = route('/a/b', App);
      });

      route('/a/b', App);
    });

    var match = route.match('a/b');

    expect(match.length).toEqual(3);

    var rootMatch = lastItem(match);

    expect(rootMatch.route).toBe(expectedRoute);
  });
});

function lastItem(array) {
  return array[array.length - 1];
}

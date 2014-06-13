require('./helper');
var Router = require('../lib/Router');
var Route = require('../lib/components/Route');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('when a route does not specify a path', function () {
  describe('or a name', function () {
    it('matches on /', function () {
      var router = Router(
        Route({ handler: App })
      );

      expect(router.path).toEqual('/');

      var match = router.match('/');
      assert(match);
    });
  });

  describe('but it has a name', function () {
    it('uses its name to match the URL', function () {
      var router = Router(
        Route({ name: 'users', handler: App })
      );

      expect(router.path).toEqual('/users');

      var match = router.match('/users');
      assert(match);
    });
  });
});

describe('a route that is missing a parameter that its parent needs', function () {
  it('throws', function () {
    expect(function () {
      Router(
        Route({ path: '/users/:userId', handler: App }, 
          Route({ path: '/users/:id/comments', handler: App })
        )
      );
    }).toThrow(/missing the "userId" parameter/);
  });
});

describe("when a router's pattern matches the URL", function () {
  it('match() returns an array with that router', function () {
    var router = Router(
      Route({ path: '/a/b/c', handler: App })
    );

    var match = router.match('/a/b/c');
    assert(match);
    expect(match.length).toEqual(1);

    var rootMatch = lastItem(match);
    expect(rootMatch.router).toBe(router);
    expect(rootMatch.params).toEqual({});
  });

  describe('and it contains dynamic segments', function () {
    it('match() returns an array with that router and its params', function () {
      var router = Router(
        Route({ path: '/posts/:id/edit', handler: App })
      );

      var match = router.match('/posts/abc/edit');
      assert(match);
      expect(match.length).toEqual(1);

      var rootMatch = lastItem(match);
      expect(rootMatch.router).toBe(router);
      expect(rootMatch.params).toEqual({ id: 'abc' });
    });
  });
});

describe("when a router's pattern does not match the URL", function () {
  it('match() returns null', function () {
    var router = Router(
      Route({ path: '/a/b/c', handler: App })
    );

    var match = router.match('/not-found');
    expect(match).toBe(null);
  });
});

describe("when a nested router matches the URL", function () {
  describe('and it has all the dynamic segments of its ancestors', function () {
    it('match() returns the appropriate params for each match', function () {
      var router = Router(
        Route({ path: '/posts/:id', name: 'posts', handler: App },
          Route({ path: '/posts/:id/comments/:commentId', name: 'comment', handler: App })
        )
      );

      var match = router.match('/posts/abc/comments/123');
      assert(match);
      expect(match.length).toEqual(2);

      var rootMatch = lastItem(match);
      expect(rootMatch.router.name).toEqual('comment');
      expect(rootMatch.params).toEqual({ id: 'abc', commentId: '123' });

      var firstMatch = match[0];
      expect(firstMatch.router.name).toEqual('posts');
      expect(firstMatch.params).toEqual({ id: 'abc' });
    });
  });
});

describe('when multiple nested routers match the URL', function () {
  it('match() returns the first one in the subtree, depth-first', function () {
    var router = Router(
      Route({ path: '/', handler: App },
        Route({ path: '/a', handler: App },
          Route({ path: '/a/b', name: 'expected', handler: App })
        ),
        Route({ path: '/a/b', handler: App })
      )
    );

    var match = router.match('/a/b');
    assert(match);
    expect(match.length).toEqual(3);

    var rootMatch = lastItem(match);
    expect(rootMatch.router.name).toEqual('expected');
  });
});

describe('a router with a named component', function () {
  it('has the correct toString representation', function () {
    var router = Router(
      Route({ path: '/', handler: App })
    );

    expect(router + '').toEqual('<AppRouter>');
  });
});

function lastItem(array) {
  return array[array.length - 1];
}

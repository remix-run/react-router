require('./helper');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('a Route', function () {

  describe('that matches the URL', function () {
    it('returns an array', function () {
      var routes = ReactTestUtils.renderIntoDocument(
        Routes(null,
          Route({ handler: App },
            Route({ path: '/a/b/c', handler: App })
          )
        )
      );

      var matches = routes.match('/a/b/c');
      assert(matches);
      expect(matches.length).toEqual(2);

      var rootMatch = getRootMatch(matches);
      expect(rootMatch.params).toEqual({});
    });

    describe('that contains dynamic segments', function () {
      it('returns an array with the correct params', function () {
        var routes = ReactTestUtils.renderIntoDocument(
          Routes(null,
            Route({ handler: App },
              Route({ path: '/posts/:id/edit', handler: App })
            )
          )
        );

        var matches = routes.match('/posts/abc/edit');
        assert(matches);
        expect(matches.length).toEqual(2);

        var rootMatch = getRootMatch(matches);
        expect(rootMatch.params).toEqual({ id: 'abc' });
      });
    });
  });

  describe('that does not match the URL', function () {
    it('returns null', function () {
      var routes = ReactTestUtils.renderIntoDocument(
        Routes(null,
          Route({ handler: App },
            Route({ path: '/a/b/c', handler: App })
          )
        )
      );

      expect(routes.match('/not-found')).toBe(null);
    });
  });

});

describe('a nested Route that matches the URL', function () {
  it('returns the appropriate params for each match', function () {
    var routes = ReactTestUtils.renderIntoDocument(
      Routes(null,
        Route({ handler: App },
          Route({ name: 'posts', path: '/posts/:id', handler: App },
            Route({ name: 'comment', path: '/posts/:id/comments/:commentID', handler: App })
          )
        )
      )
    );

    var matches = routes.match('/posts/abc/comments/123');
    assert(matches);
    expect(matches.length).toEqual(3);

    var rootMatch = getRootMatch(matches);
    expect(rootMatch.route.props.name).toEqual('comment');
    expect(rootMatch.params).toEqual({ id: 'abc', commentID: '123' });

    var postsMatch = matches[1];
    expect(postsMatch.route.props.name).toEqual('posts');
    expect(postsMatch.params).toEqual({ id: 'abc' });
  });
});

describe('multiple nested Routes that match the URL', function () {
  it('returns the first one in the subtree, depth-first', function () {
    var routes = ReactTestUtils.renderIntoDocument(
      Routes(null,
        Route({ handler: App },
          Route({ path: '/a', handler: App },
            Route({ path: '/a/b', name: 'expected', handler: App })
          ),
          Route({ path: '/a/b', handler: App })
        )
      )
    );

    var matches = routes.match('/a/b');
    assert(matches);
    expect(matches.length).toEqual(3);

    var rootMatch = getRootMatch(matches);
    expect(rootMatch.route.props.name).toEqual('expected');
  });
});

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

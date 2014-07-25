require('./helper');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('a Route that matches the URL', function () {
  it('returns an array', function () {
    var routes = TestUtils.renderIntoDocument(
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
      var routes = TestUtils.renderIntoDocument(
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

describe('a Route that does not match the URL', function () {
  it('returns null', function () {
    var routes = TestUtils.renderIntoDocument(
      Routes(null,
        Route({ handler: App },
          Route({ path: '/a/b/c', handler: App })
        )
      )
    );

    expect(routes.match('/not-found')).toBe(null);
  });
});

describe('a nested Route that matches the URL', function () {
  it('returns the appropriate params for each match', function () {
    var routes = TestUtils.renderIntoDocument(
      Routes(null,
        Route({ handler: App },
          Route({ name: 'posts', path: '/posts/:id', handler: App },
            Route({ name: 'comment', path: '/posts/:id/comments/:commentId', handler: App })
          )
        )
      )
    );

    var matches = routes.match('/posts/abc/comments/123');
    assert(matches);
    expect(matches.length).toEqual(3);

    var rootMatch = getRootMatch(matches);
    expect(rootMatch.route.props.name).toEqual('comment');
    expect(rootMatch.params).toEqual({ id: 'abc', commentId: '123' });

    var postsMatch = matches[1];
    expect(postsMatch.route.props.name).toEqual('posts');
    expect(postsMatch.params).toEqual({ id: 'abc' });
  });
});

describe('multiple nested Router that match the URL', function () {
  it('returns the first one in the subtree, depth-first', function () {
    var routes = TestUtils.renderIntoDocument(
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

describe('a route handler', function () {
  it('may not receive children', function (done) {
    var InvalidHandler = React.createClass({
      displayName: 'InvalidHandler',
      render: function () {
        try {
          var result = this.props.activeRouteHandler({}, React.DOM.div());
          assert(false, 'activeRouteHandler rendered with children');
          return result;
        } catch (error) {
          assert(error);
        }

        done();
      }
    });

    var routes = TestUtils.renderIntoDocument(
      Routes(null,
        Route({ handler: InvalidHandler },
          Route({ path: '/home', handler: App })
        )
      )
    );

    routes.dispatch('/home');
  });
});

describe('a Route', function() {
  it('requires a handler');
});

describe('a child route', function() {
  describe('path', function() {
    it('defaults to /');
    it('is not required to start with /');
    it('can be inferred from its name');
    it('must contain all dynamic segments of its parent route path');
  });

  describe('name', function() {
    it('cannot be reused');
  });
});

// describe('a Router that renders on the server', function() {
//   it('works with async willTransitionTo()', function(done) {
//     var dataStore = 'goodbye';
//     var Layout = React.createClass({
//       render: function() {
//         return React.DOM.article(null, this.props.activeRouteHandler());
//       }
//     });
//     var AsyncApp = React.createClass({
//       displayName: 'AsyncApp',
//       statics: {
//         willTransitionTo: function() {
//           return new Promise(function(resolve) {
//             setTimeout(function() {
//               dataStore = 'hello';
//               resolve();
//             }, 0);
//           });
//         }
//       },
//       render: function() {
//         return React.DOM.div(null, dataStore);
//       }
//     });

//     var router = Router(
//       RouteComponent({ handler: Layout},
//         RouteComponent({ path: '/a', handler: AsyncApp }))
//     );

//     router.renderComponentToString('/a').then(function(result) {
//       expect(result.indexOf('div') > -1).toBe(true);
//       expect(result.indexOf('hello') > -1).toBe(true);

//       done();
//     });
//   });
// });

function getRootMatch(matches) {
  return matches[matches.length - 1];
}

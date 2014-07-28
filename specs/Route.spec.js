require('./helper');
var Route = require('../modules/components/Route');
var Routes = require('../modules/components/Routes');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('a Route that matches a URL', function () {
  it('returns an array', function () {
    var routes = renderComponent(
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

    removeComponent(routes);
  });

  describe('that contains dynamic segments', function () {
    it('returns an array with the correct params', function () {
      var routes = renderComponent(
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

      removeComponent(routes);
    });
  });
});

describe('a Route that does not match the URL', function () {
  it('returns null', function () {
    var routes = renderComponent(
      Routes(null,
        Route({ handler: App },
          Route({ path: '/a/b/c', handler: App })
        )
      )
    );

    expect(routes.match('/not-found')).toBe(null);

    removeComponent(routes);
  });
});

describe('a nested Route that matches the URL', function () {
  it('returns the appropriate params for each match', function () {
    var routes = renderComponent(
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

    removeComponent(routes);
  });
});

describe('multiple nested Router that match the URL', function () {
  it('returns the first one in the subtree, depth-first', function () {
    var routes = renderComponent(
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

    removeComponent(routes);
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

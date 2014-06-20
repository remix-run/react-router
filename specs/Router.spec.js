require('./helper');
var Promise = require('es6-promise').Promise;
var Router = require('../modules/Router');
var RouteComponent = require('../modules/components/Route');

var App = React.createClass({
  displayName: 'App',
  render: function () {
    return React.DOM.div();
  }
});

describe('a Router with a named component', function () {
  var router;
  beforeEach(function () {
    router = Router(
      RouteComponent({ path: '/', handler: App })
    );
  });

  it('has the correct displayName', function () {
    expect(router.displayName).toEqual('AppRouter');
  });

  it('has the correct toString representation', function () {
    expect(router + '').toEqual('<AppRouter>');
  });
});

describe('a Router that matches a URL', function () {
  it('returns an array', function () {
    var router = Router(
      RouteComponent({ path: '/a/b/c', handler: App })
    );

    var match = router.match('/a/b/c');
    assert(match);
    expect(match.length).toEqual(1);

    var rootMatch = lastItem(match);
    expect(rootMatch.params).toEqual({});
  });

  describe('that contains dynamic segments', function () {
    it('returns an array with the correct params', function () {
      var router = Router(
        RouteComponent({ path: '/posts/:id/edit', handler: App })
      );

      var match = router.match('/posts/abc/edit');
      assert(match);
      expect(match.length).toEqual(1);

      var rootMatch = lastItem(match);
      expect(rootMatch.params).toEqual({ id: 'abc' });
    });
  });
});

describe('a Router that does not match the URL', function () {
  it('returns null', function () {
    var router = Router(
      RouteComponent({ path: '/a/b/c', handler: App })
    );

    var match = router.match('/not-found');
    expect(match).toBe(null);
  });
});

describe('a nested Router that matches the URL', function () {
  it('returns the appropriate params for each match', function () {
    var router = Router(
      RouteComponent({ name: 'posts', path: '/posts/:id', handler: App },
        RouteComponent({ name: 'comment', path: '/posts/:id/comments/:commentId', handler: App })
      )
    );

    var match = router.match('/posts/abc/comments/123');
    assert(match);
    expect(match.length).toEqual(2);

    var rootMatch = lastItem(match);
    expect(rootMatch.route.name).toEqual('comment');
    expect(rootMatch.params).toEqual({ id: 'abc', commentId: '123' });

    var firstMatch = match[0];
    expect(firstMatch.route.name).toEqual('posts');
    expect(firstMatch.params).toEqual({ id: 'abc' });
  });
});

describe('multiple nested Routers that match the URL', function () {
  it('returns the first one in the subtree, depth-first', function () {
    var router = Router(
      RouteComponent({ path: '/', handler: App },
        RouteComponent({ path: '/a', handler: App },
          RouteComponent({ path: '/a/b', name: 'expected', handler: App })
        ),
        RouteComponent({ path: '/a/b', handler: App })
      )
    );

    var match = router.match('/a/b');
    assert(match);
    expect(match.length).toEqual(3);

    var rootMatch = lastItem(match);
    expect(rootMatch.route.name).toEqual('expected');
  });
});

describe('a Router with custom props', function() {
  it('receives props', function (done) {
    var router = Router(
      RouteComponent({ handler: App, customProp: 'prop' })
    );

    var component = router.renderComponent(document.createElement('div'));

    router.dispatch('/').then(function () {
      assert(component.props.customProp);
      expect(component.props.customProp).toEqual('prop');
      done();
    });
  });
});

describe('a Router that renders on the server', function() {
  it('works with async willTransitionTo()', function(done) {
    var dataStore = 'goodbye';
    var Layout = React.createClass({
      render: function() {
        return React.DOM.article(null, this.props.activeRoute);
      }
    });
    var AsyncApp = React.createClass({
      displayName: 'AsyncApp',
      statics: {
        willTransitionTo: function() {
          return new Promise(function(resolve) {
            setTimeout(function() {
              dataStore = 'hello';
              resolve();
            }, 0);
          });
        }
      },
      render: function() {
        return React.DOM.div(null, dataStore);
      }
    });

    var router = Router(
      RouteComponent({ path: '/', handler: Layout},
        RouteComponent({ path: '/a', handler: AsyncApp }))
    );

    router.renderComponentToString('/a').then(function(result) {
      expect(result.indexOf('div') > -1).toBe(true);
      expect(result.indexOf('hello') > -1).toBe(true);

      done();
    });
  });
});

function lastItem(array) {
  return array[array.length - 1];
}

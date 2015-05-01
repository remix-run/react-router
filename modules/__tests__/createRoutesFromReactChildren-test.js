var expect = require('expect');
var React = require('react');
var createRoutesFromReactChildren = require('../createRoutesFromReactChildren');
var Route = require('../components/Route');
var { Foo, Bar, Nested } = require('../TestUtils');

describe('createRoutesFromReactChildren', function () {
  it('works with falsy children', function () {
    var routes = createRoutesFromReactChildren([
      <Route path="/foo" handler={Foo}/>,
      null,
      <Route path="/bar" handler={Bar}/>,
      undefined
    ]);

    expect(routes).toEqual([
      {
        path: '/foo',
        handler: Foo
      }, {
        path: '/bar',
        handler: Bar
      }
    ]);
  });

  it('works with comments', function () {
    var routes = createRoutesFromReactChildren(
      <Route path="/foo" handler={Nested}>
        // This is a comment.
        <Route path="/bar" handler={Bar}/>
      </Route>
    );

    expect(routes).toEqual([
      {
        path: '/foo',
        handler: Nested,
        childRoutes: [
          {
            path: '/bar',
            handler: Bar
          }
        ]
      }
    ]);
  });
});

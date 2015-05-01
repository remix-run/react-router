var expect = require('expect');
var React = require('react');
var createRoutesFromReactChildren = require('../createRoutesFromReactChildren');
var Route = require('../components/Route');
var { Foo, Bar, Nested } = require('../TestUtils');

describe('createRoutesFromReactChildren', function () {
  it('works with falsy children', function () {
    var routes = createRoutesFromReactChildren([
      <Route path="/foo" component={Foo}/>,
      null,
      <Route path="/bar" component={Bar}/>,
      undefined
    ]);

    expect(routes).toEqual([
      {
        path: '/foo',
        component: Foo
      }, {
        path: '/bar',
        component: Bar
      }
    ]);
  });

  it('works with comments', function () {
    var routes = createRoutesFromReactChildren(
      <Route path="/foo" component={Nested}>
        // This is a comment.
        <Route path="/bar" component={Bar}/>
      </Route>
    );

    expect(routes).toEqual([
      {
        path: '/foo',
        component: Nested,
        childRoutes: [
          {
            path: '/bar',
            component: Bar
          }
        ]
      }
    ]);
  });
});

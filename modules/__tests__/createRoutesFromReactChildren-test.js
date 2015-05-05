var expect = require('expect');
var React = require('react');
var createRoutesFromReactChildren = require('../createRoutesFromReactChildren');
var Route = require('../components/Route');
var { Parent, Header, Sidebar } = require('../TestUtils');

describe('createRoutesFromReactChildren', function () {
  it('works with nested routes', function () {
    expect(createRoutesFromReactChildren(
      <Route component={Parent}>
        <Route path="home" components={[ Header, Sidebar ]}/>
      </Route>
    )).toEqual([
      {
        component: Parent,
        childRoutes: [
          {
            path: 'home',
            components: [ Header, Sidebar ]
          }
        ]
      }
    ]);
  });

  it('works with falsy children', function () {
    var routes = createRoutesFromReactChildren([
      <Route path="/foo" component={Parent}/>,
      null,
      <Route path="/bar" component={Parent}/>,
      undefined
    ]);

    expect(routes).toEqual([
      {
        path: '/foo',
        component: Parent
      }, {
        path: '/bar',
        component: Parent
      }
    ]);
  });

  it('works with comments', function () {
    var routes = createRoutesFromReactChildren(
      <Route path="/foo" component={Parent}>
        // This is a comment.
        <Route path="/bar" component={Header}/>
      </Route>
    );

    expect(routes).toEqual([
      {
        path: '/foo',
        component: Parent,
        childRoutes: [
          {
            path: '/bar',
            component: Header
          }
        ]
      }
    ]);
  });
});

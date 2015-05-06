var expect = require('expect');
var React = require('react');
var createRoutesFromReactChildren = require('../createRoutesFromReactChildren');
var Route = require('../Route');

describe('createRoutesFromReactChildren', function () {

  class Parent extends React.Component {
    render() {
      return (
        <div>
          <h1>Parent</h1>
          {this.props.children}
        </div>
      );
    }
  }

  class Hello extends React.Component {
    render() {
      return <div>Hello</div>;
    }
  }

  class Goodbye extends React.Component {
    render() {
      return <div>Goodbye</div>;
    }
  }
 
  it('works with nested routes', function () {
    expect(createRoutesFromReactChildren(
      <Route component={Parent}>
        <Route path="home" components={[ Hello, Goodbye ]}/>
      </Route>
    )).toEqual([
      {
        component: Parent,
        childRoutes: [
          {
            path: 'home',
            components: [ Hello, Goodbye ]
          }
        ]
      }
    ]);
  });

  it('works with falsy children', function () {
    var routes = createRoutesFromReactChildren([
      <Route path="/one" component={Parent}/>,
      null,
      <Route path="/two" component={Parent}/>,
      undefined
    ]);

    expect(routes).toEqual([
      {
        path: '/one',
        component: Parent
      }, {
        path: '/two',
        component: Parent
      }
    ]);
  });

  it('works with comments', function () {
    var routes = createRoutesFromReactChildren(
      <Route path="/one" component={Parent}>
        // This is a comment.
        <Route path="/two" component={Hello}/>
      </Route>
    );

    expect(routes).toEqual([
      {
        path: '/one',
        component: Parent,
        childRoutes: [
          {
            path: '/two',
            component: Hello
          }
        ]
      }
    ]);
  });
});

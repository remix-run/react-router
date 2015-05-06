var expect = require('expect');
var React = require('react');
var { renderToStaticMarkup } = React;
var createRouter = require('../createRouter');
var Route = require('../Route');

describe('A <Route>', function () {

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

  it('renders nested children correctly', function () {
    var Router = createRouter(
      <Route component={Parent}>
        <Route path="hello" component={Hello}/>
      </Route>
    );

    var markup = renderToStaticMarkup(<Router location="/hello"/>);
    expect(markup).toMatch(/Parent/);
    expect(markup).toMatch(/Hello/);
  });

  it('renders the child\'s component when it has no component', function () {
    var Router = createRouter(
      <Route>
        <Route path="hello" component={Hello}/>
      </Route>
    );

    var markup = renderToStaticMarkup(<Router location="/hello"/>);
    expect(markup).toMatch(/Hello/);
  });

});

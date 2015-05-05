var expect = require('expect');
var React = require('react');
var { renderToStaticMarkup } = React;
var History = require('../history/History');
var { Route } = require('../TestUtils');
var createRouter = require('../createRouter');

describe('createRouter', function () {

  class Parent extends React.Component {
    render() {
      var [ header, sidebar ] = this.props.children || [];

      return (
        <div>
          <h1>Parent</h1>
          {header}
          {sidebar}
        </div>
      );
    }
  }
  
  class Header extends React.Component {
    render() {
      return <div>Header</div>;
    }
  }
  
  class Sidebar extends React.Component {
    render() {
      return <div>Sidebar</div>;
    }
  }

  class Root extends React.Component {
    static routes = (
      <Route component={Parent}>
        <Route path="home" components={[ Header, Sidebar ]}/>
      </Route>
    )

    render() {
      return this.props.children;
    }
  }

  describe('when the location matches the root route', function () {
    it('works', function () {
      var Router = createRouter(Root, new History('/'))
      var markup = renderToStaticMarkup(<Router/>);
      expect(markup).toMatch(/Parent/);
    });
  });

  describe('when the location matches a nested route', function () {
    it('works', function () {
      var Router = createRouter(Root, new History('/home'));
      var markup = renderToStaticMarkup(<Router/>);
      expect(markup).toMatch(/Parent/);
      expect(markup).toMatch(/Header/);
      expect(markup).toMatch(/Sidebar/);
    });
  });

});

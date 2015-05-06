var expect = require('expect');
var React = require('react');
var { renderToStaticMarkup } = React;
var createRouter = require('../createRouter');
var Route = require('../Route');

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

  describe('when the location matches the root route', function () {
    it('works', function () {
      var Router = createRouter(
        <Route component={Parent}>
          <Route path="home" components={[ Header, Sidebar ]}/>
        </Route>
      );

      var markup = renderToStaticMarkup(<Router location="/"/>);
      expect(markup).toMatch(/Parent/);
    });
  });

  describe('when the location matches a nested route', function () {
    it('works', function () {
      var Router = createRouter(
        <Route component={Parent}>
          <Route path="home" components={[ Header, Sidebar ]}/>
        </Route>
      );

      var markup = renderToStaticMarkup(<Router location="/home"/>);
      expect(markup).toMatch(/Parent/);
      expect(markup).toMatch(/Header/);
      expect(markup).toMatch(/Sidebar/);
    });
  });

});

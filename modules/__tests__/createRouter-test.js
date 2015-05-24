var expect = require('expect');
var React = require('react');
var { renderToStaticMarkup } = React;
var createRouter = require('../createRouter');
var Route = require('../Route');
var Location = require('../Location');

describe('createRouter', function () {

  class Parent extends React.Component {
    render() {
      var { header, sidebar } = this.props;

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
    it('works', function (done) {
      var Router = createRouter(
        <Route component={Parent}>
          <Route path="home" components={{ header: Header, sidebar: Sidebar }}/>
        </Route>
      );

      Router.match('/', function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toMatch(/Parent/);
        done();
      });
    });
  });

  describe('when the location matches a nested route', function () {
    it('works', function (done) {
      var Router = createRouter(
        <Route component={Parent}>
          <Route path="home" components={{ header: Header, sidebar: Sidebar }}/>
        </Route>
      );

      Router.match('/home', function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toMatch(/Parent/);
        expect(markup).toMatch(/Header/);
        expect(markup).toMatch(/Sidebar/);
        done();
      });
    });
  });

  describe('multiple components on a route', function () {
    class Parent extends React.Component {
      render() {
        var { header, sidebar } = this.props;
        return (
          <div>
            <h1>Parent</h1>
            {header}
            {sidebar}
          </div>
        );
      }
    }

    var routes = (
      <Route component={Parent}>
        <Route path="/foo" components={{ header: Header, sidebar: Sidebar }}/>
      </Route>
    );

    it('renders correctly', function (done) {
      var Router = createRouter(routes);
      Router.match('/foo', function (err, props) {
        var markup = React.renderToString(<Router {...props}/>)
        expect(markup).toMatch(/Header/);
        expect(markup).toMatch(/Sidebar/);
        done();
      });
    });
  });

  describe('location argument', function () {
    it('can be a Location instance', function (done) {
      var Router = createRouter(
        <Route component={Parent} />
      );

      var location = new Location('/');
      Router.match(location, function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toMatch(/Parent/);
        done();
      });
    });

    it('can be a string', function (done) {
      var Router = createRouter(
        <Route component={Parent} />
      );

      var location = '/';
      Router.match(location, function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toMatch(/Parent/);
        done();
      });
    });

    it('can be a plain object', function (done) {
      var Router = createRouter(
        <Route component={Parent} />
      );

      var location = new Location('/');
      location = JSON.parse(JSON.stringify(location));

      Router.match(location, function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toMatch(/Parent/);
        done();
      });
    });
  });

  describe('when throwing an exception inside match callback', function () {
    it('is not swallowed', function () {
      var Router = createRouter(
        <Route component={Parent} />
      );

      expect(function () {
        Router.match('/', function (error, props) {
          throw new Error('boom!');
        });
      }).toThrow(/boom/);
    });
  });

  describe('custom renderers', function() {
    it('allows to provide a custom renderer', function() {
      var wasCalled = false;
      var render = function(component, props) {
        expect(component).toEqual(Parent);
        expect(Object.keys(props)).toEqual(['location', 'params', 'route']);
        wasCalled = true;
        return <div>Custom Render</div>;
      };
      var Router = createRouter(
        <Route component={Parent} render={render} />
      );

      Router.match('/', function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toEqual('<div>Custom Render</div>');
      });
      expect(wasCalled).toBe(true);
    });

    it('walks up the route stack and calls render on every route', function() {
      class ParentComponent extends React.Component {
        render() {
          return <div className="parent">{this.props.children}</div>
        }
      }
      var callsA = 0;
      var callsB = 0;
      var callsC = 0;
      var renderA = function(Component, props) {
        expect(Component).toEqual(ParentComponent);
        callsA++;
        return <div><Component {...props} /></div>;
      };
      var renderB = function(Component, props) {
        if (callsB == 0) {
          expect(Component).toBe(Sidebar);
        } else {
          expect(Component).toBe(Header);
        }
        callsB++;
        return (
          <div>
            {Component.name}
            {props.children}
          </div>
        );
      };
      var renderC = function(Component, props) {
        expect(Component).toEqual(Sidebar);
        callsC++;
        return null;
      };
      var Router = createRouter(
        <Route component={ParentComponent} render={renderA}>
          <Route component={Header} render={renderB}>
            <Route path="app" component={Sidebar} render={renderC} />
          </Route>
        </Route>
      );

      Router.match('/app', function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toEqual(
          '<div><div class=\"parent\"><div>Header<div>Sidebar</div></div></div></div>'
        );
      });
      expect(callsA).toBe(1);
      expect(callsB).toBe(2);
      expect(callsC).toBe(1);
    });
  });

});

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

      Router.run('/', function (error, props) {
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

      Router.run('/home', function (error, props) {
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
      Router.run('/foo', function (err, props) {
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
      Router.run(location, function (error, props) {
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
      Router.run(location, function (error, props) {
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

      Router.run(location, function (error, props) {
        var markup = renderToStaticMarkup(<Router {...props}/>);
        expect(markup).toMatch(/Parent/);
        done();
      });
    });
  });

});

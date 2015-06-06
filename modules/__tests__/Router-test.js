import expect from 'expect';
import React, { render } from 'react';
import Location from '../Location';
import Router from '../Router';
import Route from '../Route';

describe('Router', function () {
  var div = document.createElement('div');

  afterEach(function () {
    React.unmountComponentAtNode(div);
  });

  it('renders routes', function (done) {
    var Component = React.createClass({
      render() {
        return <div>hello world!</div>;
      }
    });

    render((
      <Router>
        <Route path="/" component={Component}/>
      </Router>
    ), div, function () {
      expect(div.textContent.trim()).toEqual('hello world!');
      done();
    });
  });
  
  var Component1 = React.createClass({ render() { return null; } });
  var Component2 = React.createClass({ render() { return null; } });
  var Component3 = React.createClass({ render() { return null; } });
  var Component4 = React.createClass({ render() { return null; } });

  describe('with a synchronous route config', function () {
    var childRoutes = [
      { path: 'two/:name', component: Component2 },
      { path: 'three',
        components: {
          main: Component3,
          sidebar: Component4
        }
      }
    ];

    var parentRoute = {
      path: '/',
      component: Component1,
      childRoutes: childRoutes,
    };

    var routes = [ parentRoute ];

    it('matches the correct components', function (done) {
      render(<Router location="/two/sally" children={routes}/>, div, function () {
        expect(this.state.components).toEqual([
          parentRoute.component,
          childRoutes[0].component
        ]);

        done();
      });
    });

    it('matches named components', function (done) {
      render(<Router location="/three" children={routes}/>, div, function () {
        expect(this.state.components).toEqual([
          Component1,
          { main: Component3, sidebar: Component4 }
        ]);

        done();
      });
    });

    it('matches the correct route branch', function (done) {
      render(<Router location="/three" children={routes}/>, div, function () {
        expect(this.state.branch).toEqual([
          parentRoute,
          childRoutes[1]
        ]);

        done();
      });
    });

    it('matches the correct params', function (done) {
      render(<Router location="/two/sally" children={routes}/>, div, function () {
        expect(this.state.params).toEqual({ name: 'sally' });
        done();
      });
    });
  });

  describe('with an asynchronous route config', function () {
    var childRoutes = [
      { path: 'two/:name', getComponents (cb){ cb(null, Component2); } },
      {
        path: 'three',
        getComponents (cb) {
          cb(null, {
            main: Component3,
            sidebar: Component4
          });
        }
      }
    ];

    var parentRoute = {
      path: '/',
      getChildRoutes (cb) {
        cb(null, childRoutes);
      },
      getComponents (cb) {
        cb(null, Component1);
      }
    };

    var routes = [ parentRoute ];

    var props = {
      location: new Location('/two/sally'),
      routes: parentRoute
    };

    it('matches the correct components', function (done) {
      render(<Router location="/two/sally" children={routes}/>, div, function () {
        expect(this.state.components).toEqual([ Component1, Component2 ]);
        done();
      });
    });

    it('matches named components', function (done) {
      render(<Router location="/three" children={routes}/>, div, function () {
        expect(this.state.components).toEqual([
          Component1,
          { main: Component3, sidebar: Component4 }
        ]);
        done();
      });
    });

    it('matches the correct route branch', function (done) {
      render(<Router location="/three" children={routes}/>, div, function () {
        expect(this.state.branch).toEqual([
          parentRoute,
          childRoutes[1]
        ]);

        done();
      });
    });

    it('matches the correct params', function (done) {
      render(<Router location="/two/sally" children={routes}/>, div, function () {
        expect(this.state.params).toEqual({ name: 'sally' });
        done();
      });
    });
  });

});

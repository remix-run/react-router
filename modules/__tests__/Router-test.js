import expect from 'expect';
import React, { render } from 'react';
import MemoryHistory from '../MemoryHistory';
import Location from '../Location';
import Router from '../Router';
import Route from '../Route';

describe('Router', function () {
  var div;
  beforeEach(function () {
    div = document.createElement('div');
  });

  afterEach(function () {
    React.unmountComponentAtNode(div);
  });

  var Parent = React.createClass({
    render() {
      return <div>parent{this.props.children}</div>;
    }
  });

  var Child = React.createClass({
    render() {
      return <div>child</div>;
    }
  });

  it('renders routes', function (done) {
    render((
      <Router history={new MemoryHistory('/')}>
        <Route path="/" component={Parent}/>
      </Router>
    ), div, function () {
      expect(div.textContent.trim()).toEqual('parent');
      done();
    });
  });

  it('renders child routes when the parent does not have a path', function (done) {
    render((
      <Router history={new MemoryHistory('/')}>
        <Route component={Parent}>
          <Route component={Parent}>
            <Route path="/" component={Child}/>
          </Route>
        </Route>
      </Router>
    ), div, function () {
      expect(div.textContent.trim()).toEqual('parentparentchild');
      done();
    });
  });

  it('renders nested children correctly', function (done) {
    render((
      <Router history={new MemoryHistory('/hello')}>
        <Route component={Parent}>
          <Route path="hello" component={Child}/>
        </Route>
      </Router>
    ), div, function () {
      expect(div.textContent.trim()).toMatch(/parent/);
      expect(div.textContent.trim()).toMatch(/child/);
      done();
    });
  });

  it('renders the child\'s component when it has no component', function (done) {
    render((
      <Router history={new MemoryHistory('/hello')}>
        <Route>
          <Route path="hello" component={Child}/>
        </Route>
      </Router>
    ), div, function () {
      expect(div.textContent.trim()).toMatch(/child/);
      done();
    });
  });

  it('renders with a custom `createElement` prop', function(done) {
    var Wrapper = React.createClass({
      render() {
        var { Component } = this.props;
        return <Component fromWrapper="wrapped"/>
      }
    });

    var Component = React.createClass({
      render() {
        return <div>{this.props.fromWrapper}</div>;
      }
    });

    render((
      <Router history={new MemoryHistory('/')} createElement={Component => <Wrapper Component={Component}/>}>
        <Route path="/" component={Component}/>
      </Router>
    ), div, function () {
      expect(div.textContent.trim()).toEqual('wrapped');
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
      render(<Router history={new MemoryHistory("/two/sally")} children={routes}/>, div, function () {
        expect(this.state.components).toEqual([
          parentRoute.component,
          childRoutes[0].component
        ]);

        done();
      });
    });

    it('matches named components', function (done) {
      render(<Router history={new MemoryHistory("/three")} children={routes}/>, div, function () {
        expect(this.state.components).toEqual([
          Component1,
          { main: Component3, sidebar: Component4 }
        ]);

        done();
      });
    });

    it('matches the correct route branch', function (done) {
      render(<Router history={new MemoryHistory("/three")} children={routes}/>, div, function () {
        expect(this.state.branch).toEqual([
          parentRoute,
          childRoutes[1]
        ]);

        done();
      });
    });

    it('matches the correct params', function (done) {
      render(<Router history={new MemoryHistory("/two/sally")} children={routes}/>, div, function () {
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
      getChildRoutes (state, cb) {
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
      render(<Router history={new MemoryHistory('/two/sally')} children={routes}/>, div, function () {
        expect(this.state.components).toEqual([ Component1, Component2 ]);
        done();
      });
    });

    it('matches named components', function (done) {
      render(<Router history={new MemoryHistory('/three')} children={routes}/>, div, function () {
        expect(this.state.components).toEqual([
          Component1,
          { main: Component3, sidebar: Component4 }
        ]);
        done();
      });
    });

    it('matches the correct route branch', function (done) {
      render(<Router history={new MemoryHistory('/three')} children={routes}/>, div, function () {
        expect(this.state.branch).toEqual([
          parentRoute,
          childRoutes[1]
        ]);

        done();
      });
    });

    it('matches the correct params', function (done) {
      render(<Router history={new MemoryHistory('/two/sally')} children={routes}/>, div, function () {
        expect(this.state.params).toEqual({ name: 'sally' });
        done();
      });
    });
  });

});

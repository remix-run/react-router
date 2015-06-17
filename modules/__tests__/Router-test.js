import expect from 'expect';
import React, { render } from 'react';
import MemoryHistory from '../MemoryHistory';
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

});

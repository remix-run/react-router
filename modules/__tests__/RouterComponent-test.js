import expect from 'expect';
import React from 'react';
import { createLocation } from 'history';
import createReactRouter from '../createReactRouter';
import RouterComponent from '../RouterComponent';
import Route from '../Route';
import { createRoutes } from '../RouteUtils';

describe('RouterComponent', function () {

  var node;
  beforeEach(function () {
    node = document.createElement('div');
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
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
    const router = createReactRouter(
      <Route path="/" component={Parent} />
    );

    router.match(createLocation('/'), (err, state) => {
      React.render((
        <RouterComponent {...state} />
      ), node, function () {
        expect(node.textContent.trim()).toEqual('parent');
        done();
      });
    });
  });

  it('renders child routes when the parent does not have a path', function (done) {
    const router = createReactRouter(
      <Route component={Parent}>
        <Route component={Parent}>
          <Route path="/" component={Child} />
        </Route>
      </Route>
    );

    router.match(createLocation('/'), (err, state) => {
      React.render((
        <RouterComponent {...state} />
      ), node, function () {
        expect(node.textContent.trim()).toEqual('parentparentchild');
        done();
      });
    });
  });

  it('renders nested children correctly', function (done) {
    const router = createReactRouter(
      <Route component={Parent}>
        <Route path="hello" component={Child} />
      </Route>
    );

    router.match(createLocation('/hello'), (err, state) => {
      React.render((
        <RouterComponent {...state} />
      ), node, function () {
        expect(node.textContent.trim()).toMatch(/parent/);
        expect(node.textContent.trim()).toMatch(/child/);
        done();
      });
    });
  });


  it('renders the child\'s component when it has no component', function (done) {
    const router = createReactRouter(
      <Route>
        <Route path="hello" component={Child} />
      </Route>
    );

    router.match(createLocation('/hello'), (err, state) => {
      React.render((
        <RouterComponent {...state} />
      ), node, function () {
        expect(node.textContent.trim()).toMatch(/child/);
        done();
      });
    });
  });

  it('renders with a custom `createElement` prop', function(done) {
    var Wrapper = React.createClass({
      render() {
        var { Component } = this.props;
        return <Component fromWrapper="wrapped" />
      }
    });

    var Component = React.createClass({
      render() {
        return <div>{this.props.fromWrapper}</div>;
      }
    });

    const router = createReactRouter(
      <Route path="/" component={Component}/>
    );

    router.match(createLocation('/'), (err, state) => {
      React.render((
        <RouterComponent
          {...state}
          createElement={Component => <Wrapper Component={Component} />}
        />
      ), node, function () {
        expect(node.textContent.trim()).toEqual('wrapped');
        done();
      });
    });
  });

});

import expect from 'expect';
import React from 'react';
import createHistory from 'history/lib/createMemoryHistory';
import Router from '../Router';
import Route from '../Route';

describe('Router', function () {

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
    React.render((
      <Router history={createHistory('/')}>
        <Route path="/" component={Parent} />
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toEqual('parent');
      done();
    });
  });

  it('renders child routes when the parent does not have a path', function (done) {
    React.render((
      <Router history={createHistory('/')}>
        <Route component={Parent}>
          <Route component={Parent}>
            <Route path="/" component={Child} />
          </Route>
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toEqual('parentparentchild');
      done();
    });
  });

  it('renders nested children correctly', function (done) {
    React.render((
      <Router history={createHistory('/hello')}>
        <Route component={Parent}>
          <Route path="hello" component={Child} />
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toMatch(/parent/);
      expect(node.textContent.trim()).toMatch(/child/);
      done();
    });
  });

  it('renders the child\'s component when it has no component', function (done) {
    React.render((
      <Router history={createHistory('/hello')}>
        <Route>
          <Route path="hello" component={Child} />
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toMatch(/child/);
      done();
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

    React.render((
      <Router history={createHistory('/')} createElement={Component => <Wrapper Component={Component} />}>
        <Route path="/" component={Component}/>
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toEqual('wrapped');
      done();
    });
  });

  describe('with named components', function() {
    it('renders the named components', function(done) {
      var Parent = React.createClass({
        render() {
          return (
            <div>
              {this.props.children.sidebar}-{this.props.children.content}
            </div>
          );
        }
      });

      var Sidebar = React.createClass({
        render() {
          return <div>sidebar</div>;
        }
      });

      var Content = React.createClass({
        render() {
          return <div>content</div>;
        }
      });

      React.render((
        <Router history={createHistory('/')}>
          <Route component={Parent}>
            <Route path="/" components={{sidebar: Sidebar, content: Content}} />
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent.trim()).toEqual('sidebar-content');
        done();
      });
    });
  });

});

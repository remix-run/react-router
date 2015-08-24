import expect from 'expect';
import React from 'react';
import createLocation from 'history/lib/createLocation';
import createHistory from 'history/lib/createMemoryHistory';
import Router from '../Router';
import Route from '../Route';

describe.skip('ActiveMixin', function () {

  var node;
  beforeEach(function () {
    node = document.createElement('div');
  });

  afterEach(function () {
    React.unmountComponentAtNode(node);
  });

  describe('a pathname that matches the URL', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        React.render((
          <Router location={createLocation('/home')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.isActive('/home')).toBe(true);
          done();
        });
      });
    });

    describe('with a query that also matches', function () {
      it('is active', function (done) {
        React.render((
          <Router location={createLocation('/home?the=query')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.isActive('/home', { the: 'query' })).toBe(true);
          done();
        });
      });
    });

    describe('with a query that does not match', function () {
      it('is not active', function (done) {
        React.render((
          <Router location={createLocation('/home?the=query')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.isActive('/home', { something: 'else' })).toBe(false);
          done();
        });
      });
    });
  });

  describe('a pathname that matches a parent route, but not the URL directly', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        React.render((
          <Router location={createLocation('/absolute')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.isActive('/home')).toBe(true);
          done();
        });
      });
    });

    describe('with a query that also matches', function () {
      it('is active', function (done) {
        React.render((
          <Router location={createLocation('/absolute?the=query')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.isActive('/home', { the: 'query' })).toBe(true);
          done();
        });
      });
    });

    describe('with a query that does not match', function () {
      it('is active', function (done) {
        React.render((
          <Router location={createLocation('/absolute?the=query')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.isActive('/home', { something: 'else' })).toBe(false);
          done();
        });
      });
    });
  });

  describe('a pathname that matches only the beginning of the URL', function () {
    it('is not active', function (done) {
      React.render((
        <Router location={createLocation('/home')}>
          <Route path="/home" />
        </Router>
      ), node, function () {
        expect(this.isActive('/h')).toBe(false);
        done();
      });
    });
  });

});

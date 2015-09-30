/*eslint-env mocha */
import expect from 'expect'
import React from 'react'
import createHistory from 'history/lib/createMemoryHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'
import qs from 'qs'

describe('isActive', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  describe('a pathname that matches the URL', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/home')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home')).toBe(true)
          done()
        })
      })
    })

    describe('with a query that also matches', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/home?the=query')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { the: 'query' })).toBe(true)
          done()
        })
      })
    })

    describe('with a query that does not match', function () {
      it('is not active', function (done) {
        React.render((
          <Router history={createHistory('/home?the=query')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { something: 'else' })).toBe(false)
          done()
        })
      })
    })
  })

  describe('a pathname that matches a parent route, but not the URL directly', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/absolute')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home')).toBe(true)
          expect(this.history.isActive('/home', null, true)).toBe(false)
          done()
        })
      })
    })

    describe('with a query that also matches', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/absolute?the=query')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { the: 'query' })).toBe(true)
          expect(this.history.isActive('/home', { the: 'query' }, true)).toBe(false)
          done()
        })
      })
    })

    describe('with a query that does not match', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/absolute?the=query')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { something: 'else' })).toBe(false)
          expect(this.history.isActive('/home', { something: 'else' }, true)).toBe(false)
          done()
        })
      })
    })

    describe('with a custom parse function and a query that does not match', function () {
      it('is not active', function (done) {
        function stringifyQuery(params) {
            return qs.stringify(params, { arrayFormat: 'indices' })
        }
        function parseQueryString(query) {
            return qs.parse(query, { arrayLimit: 0 })
        }

        React.render((
          <Router history={createHistory('/home?foo[4]=bar')} stringifyQuery={stringifyQuery} parseQueryString={parseQueryString}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: { 1: 'bar' } })).toBe(false)
          done()
        })
      })
    })
  })

  describe('a pathname that matches an index URL', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/home')}>
            <Route path="/home">
              <IndexRoute />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', null)).toBe(true)
          expect(this.history.isActive('/home', null, true)).toBe(true)
          done()
        })
      })
    })

    describe('with a query that also matches', function () {
      it('is active', function (done) {
        React.render((
          <Router history={createHistory('/home?the=query')}>
            <Route path="/home">
              <IndexRoute />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { the: 'query' })).toBe(true)
          expect(this.history.isActive('/home', { the: 'query' }, true)).toBe(true)
          done()
        })
      })
    })

    describe('with a query that does not match', function () {
      it('is not active', function (done) {
        React.render((
          <Router history={createHistory('/home?the=query')}>
            <Route path="/home">
              <IndexRoute />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { something: 'else' })).toBe(false)
          expect(this.history.isActive('/home', { something: 'else' }, true)).toBe(false)
          done()
        })
      })
    })
  })

  describe('a pathname that matches only the beginning of the URL', function () {
    it('is not active', function (done) {
      React.render((
        <Router history={createHistory('/home')}>
          <Route path="/home" />
        </Router>
      ), node, function () {
        expect(this.history.isActive('/h')).toBe(false)
        done()
      })
    })
  })

  describe('a pathname that matches the root URL only if it is a parent route', function () {
    it('is active', function (done) {
      React.render((
        <Router history={createHistory('/home')}>
          <Route path="/">
            <Route path="/home" />
          </Route>
        </Router>
      ), node, function () {
        expect(this.history.isActive('/')).toBe(true)
        done()
      })
    })
  })

  describe('a pathname that does not match the root URL if it is not a parent route', function () {
    it('is not active', function (done) {
      React.render((
        <Router history={createHistory('/home')}>
          <Route path="/" />
          <Route path="/home" />
        </Router>
      ), node, function () {
        expect(this.history.isActive('/')).toBe(false)
        done()
      })
    })
  })

})

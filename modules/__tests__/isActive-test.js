import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
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
    unmountComponentAtNode(node)
  })

  describe('a pathname that matches the URL', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        render((
          <Router history={createHistory('/home?the=query')}>
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
        render((
          <Router history={createHistory('/home?the=query')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { the: 'query' })).toBe(true)
          done()
        })
      })
    })

    describe('with a query that also matches by value, but not by type', function () {
      it('is active', function (done) {
        render((
          <Router history={createHistory('/home?the=query&n=2&show=false')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { the: 'query', n: 2, show: false })).toBe(true)
          done()
        })
      })
    })

    describe('with a query that does not match', function () {
      it('is not active', function (done) {
        render((
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
        render((
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
        render((
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
        render((
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
  })

  describe('a pathname that matches an index URL', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        render((
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
        render((
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
        render((
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
      render((
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
      render((
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
      render((
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

  describe('a pathname that matches URL', function () {
    describe('with query that does match', function () {
      it('is active', function (done) {
        render((
          <Router history={createHistory('/home?foo[]=bar&foo[]=bar1&foo[]=bar2')}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: [ 'bar', 'bar1', 'bar2' ] })).toBe(true)
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
          return qs.parse(query, { parseArrays: false })
        }

        render((
          <Router history={createHistory('/home?foo[1]=bar')} stringifyQuery={stringifyQuery} parseQueryString={parseQueryString}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: { 4: 'bar' } })).toBe(false)
          done()
        })
      })
    })

    describe('with a custom parse function and a query that match', function () {
      it('is active', function (done) {
        function stringifyQuery(params) {
          return qs.stringify(params, { arrayFormat: 'indices' })
        }
        function parseQueryString(query) {
          return qs.parse(query, { parseArrays: false })
        }

        render((
          <Router history={createHistory('/home?foo[4]=bar&foo[1]=bar2')} stringifyQuery={stringifyQuery} parseQueryString={parseQueryString}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: { 1: 'bar2', 4: 'bar' } })).toBe(true)
          done()
        })
      })
    })

    describe('with a query with explicit undefined values', function () {
      it('matches missing query keys', function (done) {
        render((
          <Router history={createHistory('/home?foo=1')}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: 1, bar: undefined })).toBe(true)
          done()
        })
      })

      it('does not match a present query key', function (done) {
        render((
          <Router history={createHistory('/home?foo=1&bar=')}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: 1, bar: undefined })).toBe(false)
          done()
        })
      })
    })
  })

  describe('dynamic routes', function () {
    const routes = {
      path: '/',
      childRoutes: [
        { path: 'foo' }
      ],
      getIndexRoute(location, callback) {
        setTimeout(() => callback(null, {}))
      }
    }

    describe('when not on index route', function () {
      it('does not show index as active', function (done) {
        render((
          <Router history={createHistory('/foo')} routes={routes} />
        ), node, function () {
          expect(this.history.isActive('/')).toBe(true)
          expect(this.history.isActive('/', null, true)).toBe(false)
          expect(this.history.isActive('/foo')).toBe(true)
          done()
        })
      })
    })

    describe('when on index route', function () {
      it('shows index as active', function (done) {
        render((
          <Router history={createHistory('/')} routes={routes} />
        ), node, function () {
          // Need to wait for async match to complete.
          setTimeout(() => {
            expect(this.history.isActive('/')).toBe(true)
            expect(this.history.isActive('/', null, true)).toBe(true)
            expect(this.history.isActive('/foo')).toBe(false)
            done()
          })
        })
      })
    })
  })
})

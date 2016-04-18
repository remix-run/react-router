import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import useRouterHistory from '../useRouterHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'
import shouldWarn from './shouldWarn'

const createRouterHistory = useRouterHistory(createHistory)

describe('v1 isActive', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  beforeEach(function () {
    shouldWarn('deprecated')
  })

  describe('a pathname that matches the URL', function () {
    describe('with a query that also matches', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/home?the=query')}>
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
          <Router history={createRouterHistory('/home?the=query&n=2&show=false')}>
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
          <Router history={createRouterHistory('/home?the=query')}>
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { something: 'else' })).toBe(false)
          done()
        })
      })
    })
  })

  describe('nested routes', function () {
    describe('on the child', function () {
      it('is active for the child and the parent', function (done) {
        render((
          <Router history={createRouterHistory('/parent/child')}>
            <Route path="/parent">
              <Route path="child" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/parent/child')).toBe(true)
          expect(this.history.isActive('/parent/child', null, true)).toBe(true)
          expect(this.history.isActive('/parent')).toBe(true)
          expect(this.history.isActive('/parent', null, true)).toBe(false)
          done()
        })
      })
    })

    describe('on the parent', function () {
      it('is active for the parent', function (done) {
        render((
          <Router history={createRouterHistory('/parent')}>
            <Route path="/parent">
              <Route path="child" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/parent/child')).toBe(false)
          expect(this.history.isActive('/parent/child', null, true)).toBe(false)
          expect(this.history.isActive('/parent')).toBe(true)
          expect(this.history.isActive('/parent', null, true)).toBe(true)
          done()
        })
      })
    })
  })

  describe('a pathname that matches a parent route, but not the URL directly', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/absolute')}>
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
          <Router history={createRouterHistory('/absolute?the=query')}>
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
          <Router history={createRouterHistory('/absolute?the=query')}>
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

  describe('a pathname that matches a nested absolute path', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/absolute')}>
            <Route path="/home">
              <Route path="/absolute" />
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/absolute')).toBe(true)
          expect(this.history.isActive('/absolute', null, true)).toBe(true)
          done()
        })
      })
    })
  })

  describe('a pathname that matches an index URL', function () {
    describe('with no query', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/home')}>
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
          <Router history={createRouterHistory('/home?the=query')}>
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
          <Router history={createRouterHistory('/home?the=query')}>
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

    describe('with the index route nested under a pathless route', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/home')}>
            <Route path="/home">
              <Route>
                <IndexRoute />
              </Route>
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', null)).toBe(true)
          expect(this.history.isActive('/home', null, true)).toBe(true)
          done()
        })
      })
    })

    describe('with a nested index route', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/parent/child')}>
            <Route path="/parent">
              <Route path="child">
                <IndexRoute />
              </Route>
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/parent/child', null)).toBe(true)
          expect(this.history.isActive('/parent/child', null, true)).toBe(true)
          done()
        })
      })

      it('is not active with extraneous slashes', function (done) {
        render((
          <Router history={createRouterHistory('/parent/child')}>
            <Route path="/parent">
              <Route path="child">
                <IndexRoute />
              </Route>
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/parent///child///', null)).toBe(false)
          expect(this.history.isActive('/parent///child///', null, true)).toBe(false)
          done()
        })
      })
    })

    describe('with a nested index route under a pathless route', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/parent/child')}>
            <Route path="/parent">
              <Route path="child">
                <Route>
                  <IndexRoute />
                </Route>
              </Route>
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/parent/child', null)).toBe(true)
          expect(this.history.isActive('/parent/child', null, true)).toBe(true)
          done()
        })
      })

      it('is not active with extraneous slashes', function (done) {
        render((
          <Router history={createRouterHistory('/parent/child')}>
            <Route path="/parent">
              <Route path="child">
                <Route>
                  <IndexRoute />
                </Route>
              </Route>
            </Route>
          </Router>
        ), node, function () {
          expect(this.history.isActive('/parent///child///', null)).toBe(false)
          expect(this.history.isActive('/parent///child///', null, true)).toBe(false)
          done()
        })
      })
    })
  })

  describe('a pathname that matches URL', function () {
    describe('with query that does match', function () {
      it('is active', function (done) {
        render((
          <Router history={createRouterHistory('/home?foo=bar&foo=bar1&foo=bar2')}>
            <Route path="/" />
            <Route path="/home" />
          </Router>
        ), node, function () {
          expect(this.history.isActive('/home', { foo: [ 'bar', 'bar1', 'bar2' ] })).toBe(true)
          done()
        })
      })
    })

    describe('with a query with explicit undefined values', function () {
      it('matches missing query keys', function (done) {
        render((
          <Router history={createRouterHistory('/home?foo=1')}>
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
          <Router history={createRouterHistory('/home?foo=1&bar=')}>
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
          <Router history={createRouterHistory('/foo')} routes={routes} />
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
          <Router history={createRouterHistory('/')} routes={routes} />
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

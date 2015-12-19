import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'
import Route from '../Route'
import qs from 'qs'

describe('v1 isActive', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  describe('a pathname that matches URL', function () {
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
  })
})

import expect from 'expect'
import { matchPattern } from '../PatternUtils'
import * as rules from '../rules'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Router from '../Router'
import Route from '../Route'
import createHistory from 'history/lib/createMemoryHistory'

describe('custom Rules', function () {

  function assertMatch({ pattern, params }, pathname, remainingPathname, paramNames, paramValues) {
    const match = matchPattern(pattern, pathname, params)
    expect(match.remainingPathname).toEqual(remainingPathname)
    expect(match.paramNames).toEqual(paramNames)
    expect(match.paramValues).toEqual(paramValues)
  }

  describe('when there is no param rule', function () {
    const pattern = '/users/:userId'

    it('treats the parameter as string', function () {
      assertMatch({ pattern }, '/users/xyz', '', [ 'userId' ], [ 'xyz' ])
    })

  })

  describe('int rule', function () {
    const pathDef = {
      pattern: '/friends/:userId',
      params: { userId: rules.int() }
    }

    it('doesn\'t validate non-integers', function () {
      assertMatch(pathDef, '/friends/xyz')
    })

    it('converts the parameter to integer', function () {
      assertMatch(pathDef, '/friends/1234', '', [ 'userId' ], [ 1234 ])
      expect(matchPattern(pathDef.pattern, '/friends/1234').paramValues[0])
        .toBe(1234)
    })

    describe('when the `max` argument is set', function () {
      const pathDef = {
        pattern: '/enemies/:userId',
        params: { userId: rules.int({ max: 100 }) }
      }

      it('validates only values lower than max', function () {
        assertMatch(pathDef, '/enemies/200')
        assertMatch(pathDef, '/enemies/88', '', [ 'userId' ], [ 88 ])
      })

    })

    describe('when the `min` argument is set', function () {
      const pathDef = {
        pattern: '/clients/:userId',
        params: { userId: rules.int({ min: 100 }) }
      }

      it('validates only values higher than max', function () {
        assertMatch(pathDef, '/clients/88')
        assertMatch(pathDef, '/clients/200', '', [ 'userId' ], [ 200 ])
      })

    })

    describe('when the `fixedLength` argument is set', function () {
      const pathDef = {
        pattern: '/players/:userId',
        params: { userId: rules.int({ fixedLength: 4 }) }
      }

      it('validates only values with the specified length', function () {
        assertMatch(pathDef, '/players/883')
        assertMatch(pathDef, '/players/61012')
        assertMatch(pathDef, '/players/2004', '', [ 'userId' ], [ 2004 ])
      })

    })

  })

  describe('string rule', function () {

    describe('when the `maxLength` argument is set', function () {
      const pathDef = {
        pattern: 'searchSmall/:query',
        params: { query: rules.string({ maxLength: 8 }) }
      }

      it('accepts only values shorter than `maxLength`', function () {
        assertMatch(pathDef, '/searchSmall/loooooong')
        assertMatch(pathDef, '/searchSmall/short', '', [ 'query' ], [ 'short' ])
      })
    })

    describe('when the `minLength` argument is set', function () {
      const pathDef = {
        pattern: 'searchLong/:query',
        params: { query: rules.string({ minLength: 8 }) }
      }

      it('accepts only values longer than `minLength`', function () {
        assertMatch(pathDef, '/searchLong/loooooong', '', [ 'query' ], [ 'loooooong' ])
        assertMatch(pathDef, '/searchLong/short')
      })
    })

    describe('when the `length` argument is set', function () {
      const pathDef = {
        pattern: 'search/:query',
        params: { query: rules.string({ length: 6 }) }
      }

      it('accepts only values with the specified length', function () {
        assertMatch(pathDef, '/search/normal', '', [ 'query' ], [ 'normal' ])
        assertMatch(pathDef, '/search/short')
        assertMatch(pathDef, '/search/loooooong')
      })
    })

  })

  describe('greedySplat rule', function () {
    const pathDef = {
      pattern: '/:location/g',
      params: { location: rules.greedySplat() }
    }

    it('behaves like "**"', function () {
      assertMatch(pathDef, '/greedy/is/good/g', '', [ 'location' ], [ 'greedy/is/good' ])
    })

  })

  describe('splat rule', function () {
    const pathDef = {
      pattern: '/:path/:file.jpg',
      params: { path: rules.greedySplat(), file: rules.splat() }
    }

    it('behaves like "*"', function () {
      assertMatch(pathDef, '/files/path/to/file.jpg', '', [ 'path', 'file' ], [ 'files/path/to', 'file' ])
    })

  })

  describe('any rule', function () {
    const pathDef = {
      pattern: 'images/:file.:extension',
      params: { extension: rules.any('jpg', 'png', 'gif') }
    }

    it('validates only valid options', function () {
      assertMatch(pathDef, 'images/foo.bar')
      assertMatch(pathDef, 'images/foo.jpg', '',[ 'file', 'extension' ], [ 'foo', 'jpg' ])
      assertMatch(pathDef, 'images/bar.png', '',[ 'file', 'extension' ], [ 'bar', 'png' ])
      assertMatch(pathDef, 'images/bar.gif', '',[ 'file', 'extension' ], [ 'bar', 'gif' ])
    })
  })

  describe('UUID rule', function () {
    const pathDef = {
      pattern: 'users/:userUuid',
      params: { userUuid: rules.uuid() }
    }

    it('validates only valid UUIDs', function () {
      assertMatch(pathDef, 'users/a63ed95a-8061-11e5-8bcf-feff819cdc9f', '', [ 'userUuid' ], [ 'a63ed95a-8061-11e5-8bcf-feff819cdc9f' ])
      assertMatch(pathDef, 'users/a63ed95a-8061-11e5-8bcf-feff819cdc9o')
    })
  })

  describe('A route component', function () {

    let node
    beforeEach(function () {
      node = document.createElement('div')
    })

    afterEach(function () {
      unmountComponentAtNode(node)
    })

    it('nests the parameter rules', function (done) {
      class Parent extends Component {
        render() {
          return <div>{this.props.children}</div>
        }
      }

      class Child extends Component {
        render() {
          expect(this.props.params.userId).toBe(123)
          expect(this.props.params.detailId).toBe(456)
          return <h1>{this.props.params.userId}</h1>
        }
      }

      render((
        <Router history={createHistory('/foo/123/bar/456')}>
          <Route component={Parent} params={{ userId: rules.int() }}>
            <Route path="/foo/:userId/bar/:detailId" params={{ detailId: rules.int() }} component={Child} />
          </Route>
        </Router>
      ), node, done)
    })

  })

})

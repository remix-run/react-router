import assert from 'assert'
import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import useRouterHistory from '../useRouterHistory'
import createHistory from 'history/lib/createMemoryHistory'
import Redirect from '../Redirect'
import Router from '../Router'
import Route from '../Route'

describe('useRouterHistory', function () {
  it('adds backwards compatibility flag', function () {
    const history = useRouterHistory(createHistory)()
    expect(history.__v2_compatible__).toBe(true)
  })

  it('passes along options, especially query parsing', function (done) {
    const history = useRouterHistory(createHistory)({
      stringifyQuery() {
        assert(true)
        done()
      }
    })

    history.push({ pathname: '/', query: { test: true } })
  })

  describe('when using basename', function () {

    let node
    beforeEach(function () {
      node = document.createElement('div')
    })

    afterEach(function () {
      unmountComponentAtNode(node)
    })

    it('should regard basename', function (done) {
      const pathnames = []
      const basenames = []
      const history = useRouterHistory(createHistory)({
        entries: '/foo/notes/5',
        basename: '/foo'
      })
      history.listen(function (location) {
        pathnames.push(location.pathname)
        basenames.push(location.basename)
      })
      render((
        <Router history={history}>
          <Route path="/messages/:id" />
          <Redirect from="/notes/:id" to="/messages/:id" />
        </Router>
      ), node, function () {
        expect(pathnames).toEqual([ '/notes/5', '/messages/5' ])
        expect(basenames).toEqual([ '/foo', '/foo' ])
        expect(this.state.location.pathname).toEqual('/messages/5')
        expect(this.state.location.basename).toEqual('/foo')
        done()
      })
    })
  })
})

import assert from 'assert'
import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import useRouterHistory from '../useRouterHistory'
import createHistory from 'history/lib/createMemoryHistory'
import Redirect from '../Redirect'
import Router from '../Router'
import Route from '../Route'

describe('useRouterHistory', () => {
  it('passes along options, especially query parsing', done => {
    const history = useRouterHistory(createHistory)({
      stringifyQuery() {
        assert(true)
        done()
      }
    })

    history.push({ pathname: '/', query: { test: true } })
  })

  describe('when using basename', () => {

    let node
    beforeEach(() => {
      node = document.createElement('div')
    })

    afterEach(() => {
      unmountComponentAtNode(node)
    })

    it('should regard basename', () => {
      const history = useRouterHistory(createHistory)({
        entries: '/foo/notes/5',
        basename: '/foo'
      })

      const pathnames = []
      const basenames = []

      const currentLocation = history.getCurrentLocation()
      pathnames.push(currentLocation.pathname)
      basenames.push(currentLocation.basename)

      history.listen(location => {
        pathnames.push(location.pathname)
        basenames.push(location.basename)
      })

      const instance = render((
        <Router history={history}>
          <Route path="/messages/:id" />
          <Redirect from="/notes/:id" to="/messages/:id" />
        </Router>
      ), node)

      expect(pathnames).toEqual([ '/notes/5', '/messages/5' ])
      expect(basenames).toEqual([ '/foo', '/foo' ])
      expect(instance.state.location.pathname).toEqual('/messages/5')
      expect(instance.state.location.basename).toEqual('/foo')
    })
  })
})

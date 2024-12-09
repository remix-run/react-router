import expect from 'expect'
import React from 'react'
import { render } from '@testing-library/react'
import useRouterHistory from '../useRouterHistory'
import createHistory from 'history/lib/createMemoryHistory'
import Redirect from '../Redirect'
import Router from '../Router'
import Route from '../Route'

describe('useRouterHistory', () => {
  it('passes along options, especially query parsing', (done) => {
    const history = useRouterHistory(createHistory)({
      stringifyQuery() {
        console.assert(true)
        done()
      }
    })

    history.push({ pathname: '/', query: { test: true } })
  })

  describe('when using basename', () => {
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

      const unsubscribe = history.listen((location) => {
        pathnames.push(location.pathname)
        basenames.push(location.basename)
      })

      render(
        <Router history={history}>
          <Route path="/messages/:id" />
          <Redirect from="/notes/:id" to="/messages/:id" />
        </Router>
      )

      expect(pathnames).toEqual([ '/notes/5', '/messages/5' ])
      expect(basenames).toEqual([ '/foo', '/foo' ])
      expect(history.getCurrentLocation().pathname).toEqual('/messages/5')
      expect(history.getCurrentLocation().basename).toEqual('/foo')

      unsubscribe()
    })
  })
})

import expect from 'expect'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import Redirect from '../Redirect'
import Router from '../Router'
import Route from '../Route'

describe('A <Redirect>', function () {
  afterEach(function () {
    cleanup()
  })

  it('works', function () {
    const history = createHistory('/notes/5')
    render(
      <Router history={history}>
        <Route path="/messages/:id" />
        <Redirect from="/notes/:id" to="/messages/:id" />
      </Router>
    )
    expect(history.getCurrentLocation().pathname).toEqual('/messages/5')
  })

  it('works with relative paths', function () {
    const history = createHistory('/nested/route1')
    render(
      <Router history={history}>
        <Route path="nested">
          <Route path="route2" />
          <Redirect from="route1" to="route2" />
        </Route>
      </Router>
    )
    expect(history.getCurrentLocation().pathname).toEqual('/nested/route2')
  })

  it('works with relative paths with param', function () {
    const history = createHistory('/nested/1/route1')
    render(
      <Router history={history}>
        <Route path="nested/:id">
          <Route path="route2" />
          <Redirect from="route1" to="route2" />
        </Route>
      </Router>
    )
    expect(history.getCurrentLocation().pathname).toEqual('/nested/1/route2')
  })
})

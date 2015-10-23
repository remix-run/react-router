import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Redirect from '../Redirect'
import Router from '../Router'
import Route from '../Route'

describe('A <Redirect>', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('works', function (done) {
    render((
      <Router history={createHistory('/notes/5')}>
        <Route path="/messages/:id" />
        <Redirect from="/notes/:id" to="/messages/:id" />
      </Router>
    ), node, function () {
      expect(this.state.location.pathname).toEqual('/messages/5')
      done()
    })
  })

  it('works with relative paths', function (done) {
    render((
      <Router history={createHistory('/nested/route1')}>
        <Route path="nested">
          <Route path="route2" />
          <Redirect from="route1" to="route2" />
        </Route>
      </Router>
    ), node, function () {
      expect(this.state.location.pathname).toEqual('/nested/route2')
      done()
    })
  })

  it('works with relative paths with param', function (done) {
    render((
      <Router history={createHistory('/nested/1/route1')}>
        <Route path="nested/:id">
          <Route path="route2" />
          <Redirect from="route1" to="route2" />
        </Route>
      </Router>
    ), node, function () {
      expect(this.state.location.pathname).toEqual('/nested/1/route2')
      done()
    })
  })

})

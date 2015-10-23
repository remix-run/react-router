import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import IndexRedirect from '../IndexRedirect'
import Router from '../Router'
import Route from '../Route'

describe('An <IndexRedirect>', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('works', function (done) {
    render((
      <Router history={createHistory('/')}>
        <Route path="/">
          <IndexRedirect to="/messages" />
          <Route path="messages" />
        </Route>
      </Router>
    ), node, function () {
      expect(this.state.location.pathname).toEqual('/messages')
      done()
    })
  })

})

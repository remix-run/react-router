import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'
import withRouter from '../withRouter'
import resetHash from './resetHash'

describe('withRouter', function () {
  class App extends Component {
    render() {
      expect(this.context.router).toExist()
      return <h1>App</h1>
    }
  }

  beforeEach(resetHash)

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('puts router on context', function (done) {
    const WrappedApp = withRouter(App)

    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={WrappedApp} />
      </Router>
    ), node, function () {
      done()
    })
  })
})

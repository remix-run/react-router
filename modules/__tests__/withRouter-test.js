import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'
import { routerShape } from '../PropTypes'
import withRouter from '../withRouter'

describe('withRouter', function () {
  class App extends Component {
    render() {
      expect(this.props.router).toExist()
      return <h1>App</h1>
    }
  }

  App.propTypes = {
    router: routerShape.isRequired
  }

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

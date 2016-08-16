import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'
import routerShape from '../PropTypes'
import withRouter from '../withRouter'

describe('withRouter', function () {
  class App extends Component {
    propTypes: {
      router: routerShape.isRequired
    }
    render() {
      expect(this.props.router).toExist()
      return <h1>App</h1>
    }
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

  it('still uses router prop if provided', function (done) {
    const Test = withRouter(function (props) {
      props.test(props)
      return null
    })
    const router = {
      push() {},
      replace() {},
      go() {},
      goBack() {},
      goForward() {},
      setRouteLeaveHook() {},
      isActive() {}
    }
    const test = function (props) {
      expect(props.router).toBe(router)
    }

    render(<Test router={router} test={test} />, node, done)
  })
})

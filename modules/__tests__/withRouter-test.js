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
      expect(this.props.params).toExist()
      expect(this.props.params).toBe(this.props.router.params)
      expect(this.props.location).toExist()
      expect(this.props.location).toBe(this.props.router.location)
      return <h1>{this.props.router.location.pathname}</h1>
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

  it('puts router, props and location on context', function (done) {
    const WrappedApp = withRouter(App)

    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={WrappedApp} />
      </Router>
    ), node, function () {
      done()
    })
  })

  it('updates the context inside static containers', function (done) {
    const WrappedApp = withRouter(App)

    class StaticContainer extends Component {
      shouldComponentUpdate() {
        return false
      }

      render() {
        return this.props.children
      }
    }

    const history = createHistory('/')

    render((
      <Router history={history}>
        <Route component={StaticContainer}>
          <Route path="/" component={WrappedApp} />
          <Route path="/hello" component={WrappedApp} />
        </Route>
      </Router>
    ), node, function () {
      expect(node.firstChild.textContent).toEqual('/')
      history.push('/hello')
      expect(node.firstChild.textContent).toEqual('/hello')
      done()
    })
  })
})

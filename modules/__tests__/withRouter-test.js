import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'
import withRouter from '../withRouter'

describe('withRouter', function () {
  const routerStub = {
    push() {},
    replace() {},
    go() {},
    goBack() {},
    goForward() {},
    setRouteLeaveHook() {},
    isActive() {}
  }

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('should put router on props', function (done) {
    const MyComponent = withRouter(({ router }) => {
      expect(router).toExist()
      done()
      return null
    })

    function App() {
      return <MyComponent /> // Ensure no props are passed explicitly.
    }

    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={App} />
      </Router>
    ), node)
  })

  it('should set displayName', function () {
    function MyComponent() {
      return null
    }

    MyComponent.displayName = 'MyComponent'

    expect(withRouter(MyComponent).displayName)
      .toEqual('withRouter(MyComponent)')
  })

  it('should use router prop if specified', function (done) {
    const MyComponent = withRouter(({ router }) => {
      expect(router).toBe(routerStub)
      done()
      return null
    })

    render(<MyComponent router={routerStub} />, node)
  })

  it('should support withRef', function () {
    const spy = expect.createSpy()

    class MyComponent extends Component {
      invokeSpy() {
        spy()
      }

      render() {
        return null
      }
    }

    const WrappedComponent = withRouter(MyComponent, { withRef: true })

    const instance = render(<WrappedComponent router={routerStub} />, node)
    instance.getWrappedInstance().invokeSpy()

    expect(spy).toHaveBeenCalled()
  })
})

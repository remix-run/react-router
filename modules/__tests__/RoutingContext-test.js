import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import RoutingContext from '../RoutingContext'
import match from '../match'

describe('RoutingContext', () => {
  let node, routes, context, history

  beforeEach(() => {
    node = document.createElement('div')
    history = { push() {}, replace() {} }

    class Component extends React.Component {
      constructor(props, ctx) {
        super(props, ctx)
        context = ctx
      }
      render() { return null }
    }

    Component.contextTypes = {
      router: React.PropTypes.object.isRequired
    }

    routes = { path: '/', component: Component }
  })

  afterEach(() => unmountComponentAtNode(node))

  function renderTest(done) {
    match({ location: '/', routes }, (err, redirect, renderProps) => {
      render(<RoutingContext {...renderProps} history={history} />, node)
      done()
    })
  }

  describe('2.0', () => {
    it('exports only `router` to context')
  })

  it('exports a `router` object to routing context', (done) => {
    renderTest(() => {
      expect(context.router).toExist()
      done()
    })
  })

  describe('interaction with history', () => {
    it('proxies calls to `push` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      history.push = (...params) => {
        expect(params).toEqual(args)
        done()
      }
      renderTest(() => {
        context.router.push(...args)
      })
    })

    it('proxies calls to `replace` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      history.replace = (...params) => {
        expect(params).toEqual(args)
        done()
      }
      renderTest(() => {
        context.router.replace(...args)
      })
    })

    it('proxies calls to `addRouteLeaveHook` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      const retVal = function () {}
      history.listenBeforeLeavingRoute = (...params) => {
        expect(params).toEqual(args)
        return retVal
      }
      renderTest(() => {
        const remove = context.router.addRouteLeaveHook(...args)
        expect(remove).toBe(retVal)
        done()
      })
    })

    it('proxies calls to `isActive` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      const retVal = function () {}
      history.isActive = (...params) => {
        expect(params).toEqual(args)
        return retVal
      }
      renderTest(() => {
        const isActive = context.router.isActive(...args)
        expect(isActive).toBe(retVal)
        done()
      })
    })
  })

})

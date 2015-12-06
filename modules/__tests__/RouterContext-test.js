import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import RouterContext from '../RouterContext'
import match from '../match'

describe('RouterContext', () => {
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
      render(<RouterContext {...renderProps} history={history} />, node)
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

    it('proxies calls to `createHref` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      const retVal = function () {}
      history.createHref = (...params) => {
        expect(params).toEqual(args)
        return retVal
      }
      renderTest(() => {
        const createHref = context.router.createHref(...args)
        expect(createHref).toBe(retVal)
        done()
      })
    })

    it('proxies calls to `go` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      const retVal = function () {}
      history.go = (...params) => {
        expect(params).toEqual(args)
        return retVal
      }
      renderTest(() => {
        const go = context.router.go(...args)
        expect(go).toBe(retVal)
        done()
      })
    })

    it('proxies calls to `goBack` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      const retVal = function () {}
      history.goBack = (...params) => {
        expect(params).toEqual(args)
        return retVal
      }
      renderTest(() => {
        const goBack = context.router.goBack(...args)
        expect(goBack).toBe(retVal)
        done()
      })
    })

    it('proxies calls to `goForward` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      const retVal = function () {}
      history.goForward = (...params) => {
        expect(params).toEqual(args)
        return retVal
      }
      renderTest(() => {
        const goForward = context.router.goForward(...args)
        expect(goForward).toBe(retVal)
        done()
      })
    })
  })

})

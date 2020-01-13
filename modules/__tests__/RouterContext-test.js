/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

import match from '../match'
import RouterContext, { Context } from '../RouterContext'
import { createRouterObject } from '../RouterUtils'

describe('RouterContext', () => {
  let node, routes, context, history, transitionManager, router
  let listenBeforeLeavingRouteSentinel, isActiveSentinel, createHrefSentinel

  beforeEach(() => {
    listenBeforeLeavingRouteSentinel = {}
    isActiveSentinel = {}
    createHrefSentinel = {}

    node = document.createElement('div')

    history = {
      push: expect.createSpy(),
      replace: expect.createSpy(),
      createHref: expect.createSpy().andReturn(createHrefSentinel),
      go: expect.createSpy(),
      goBack: expect.createSpy(),
      goForward: expect.createSpy()
    }
    transitionManager = {
      listenBeforeLeavingRoute: expect.createSpy().andReturn(listenBeforeLeavingRouteSentinel),
      isActive: expect.createSpy().andReturn(isActiveSentinel)
    }

    router = createRouterObject(history, transitionManager, {})

    class Component extends React.Component {
      constructor(props, ctx) {
        super(props, ctx)
        context = ctx
      }
      render() { return null }
    }

    Component.contextType = Context

    routes = { path: '/', component: Component }
  })

  afterEach(() => unmountComponentAtNode(node))

  function renderTest(done) {
    match({ location: '/', routes }, (err, redirect, renderProps) => {
      render(<RouterContext {...renderProps} history={history} router={router} />, node)
      done()
    })
  }

  it('exports a `router` object to routing context', (done) => {
    renderTest(() => {
      expect(context.router).toExist()
      done()
    })
  })

  it('injects a `router` object into props of route components', (done) => {
    class RoutedComponent extends React.Component {
      render() {
        expect(this.props.router).toBeA(Object)
        return null
      }
    }

    match({ location: '/', routes: { path: '/', component: RoutedComponent } }, (err, redirect, renderProps) => {
      render(<RouterContext {...renderProps} history={history} router={router}  />, node, done)
    })
  })

  describe('some weird tests that test implementation and should probably go away', () => {
    it('proxies calls to `push` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        context.router.push(...args)
        expect(history.push).toHaveBeenCalledWith(...args)
        done()
      })
    })

    it('proxies calls to `replace` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        context.router.replace(...args)
        expect(history.replace).toHaveBeenCalledWith(...args)
        done()
      })
    })

    it('proxies calls to `setRouteLeaveHook` to `props.transitionManager`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        const remove = context.router.setRouteLeaveHook(...args)
        expect(transitionManager.listenBeforeLeavingRoute).toHaveBeenCalledWith(...args)
        expect(remove).toBe(listenBeforeLeavingRouteSentinel)
        done()
      })
    })

    it('proxies calls to `isActive` to `props.transitionManager`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        const isActive = context.router.isActive(...args)
        expect(transitionManager.isActive).toHaveBeenCalledWith(...args)
        expect(isActive).toBe(isActiveSentinel)
        done()
      })
    })

    it('proxies calls to `createHref` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        const href = context.router.createHref(...args)
        expect(history.createHref).toHaveBeenCalledWith(...args)
        expect(href).toBe(createHrefSentinel)
        done()
      })
    })

    it('proxies calls to `go` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        context.router.go(...args)
        expect(history.go).toHaveBeenCalledWith(...args)
        done()
      })
    })

    it('proxies calls to `goBack` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        context.router.goBack(...args)
        expect(history.goBack).toHaveBeenCalledWith(...args)
        done()
      })
    })

    it('proxies calls to `goForward` to `props.history`', (done) => {
      const args = [ 1, 2, 3 ]
      renderTest(() => {
        context.router.goForward(...args)
        expect(history.goForward).toHaveBeenCalledWith(...args)
        done()
      })
    })
  })

})

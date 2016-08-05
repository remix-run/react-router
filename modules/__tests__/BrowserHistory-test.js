import React, { PropTypes } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import BrowserHistory from '../BrowserHistory'
import RenderTestSequences from './RenderTestSequences'

describe('BrowserHistory', () => {
  let node
  beforeEach(() => {
    window.history.replaceState(null, null, '/')
    node = document.createElement('div')
  })

  afterEach(() => {
    unmountComponentAtNode(node)
  })

  describe('push', () => {
    it('emits a new location', (done) => {
      const children = RenderTestSequences.PushEmitsANewLocation(done)
      render(<BrowserHistory children={children}/>, node)
    })

    describe('with state', () => {
      it('uses a key', (done) => {
        const children = RenderTestSequences.PushWithStateUsesAKey(done)
        render(<BrowserHistory children={children}/>, node)
      })
    })
  })

  describe('replace', () => {
    it('emits a new location', (done) => {
      const children = RenderTestSequences.ReplaceEmitsANewLocation(done)
      render(<BrowserHistory children={children}/>, node)
    })
  })

  describe('pop', () => {
    it('emits a new location', (done) => {
      const children = RenderTestSequences.PopEmitsANewLocation(done)
      render(<BrowserHistory children={children}/>, node)
    })
  })
})

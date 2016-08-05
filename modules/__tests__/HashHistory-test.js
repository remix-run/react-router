import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import HashHistory from '../HashHistory'
import RenderTestSequences from './RenderTestSequences'

describe('HashHistory', () => {
  let node
  beforeEach((done) => {
    window.location.hash = ''
    node = document.createElement('div')

    // Some browsers need a little time to reflect the hash change.
    setTimeout(done, 10)
  })

  afterEach(() => {
    unmountComponentAtNode(node)
  })

  describe('push', () => {
    it('emits a new location', (done) => {
      const children = RenderTestSequences.PushEmitsANewLocation(done)
      render(<HashHistory children={children}/>, node)
    })

    describe('with state', () => {
      it('uses a key', (done) => {
        const children = RenderTestSequences.PushWithStateUsesAKey(done)
        render(<HashHistory children={children}/>, node)
      })
    })

    // This behavior is unique to hash history.
    describe('without state', () => {
      it('omits the key', (done) => {
        const children = RenderTestSequences.PushWithoutStateOmitsTheKey(done)
        render(<HashHistory children={children}/>, node)
      })
    })
  })

  describe('replace', () => {
    it('emits a new location', (done) => {
      const children = RenderTestSequences.ReplaceEmitsANewLocation(done)
      render(<HashHistory children={children}/>, node)
    })
  })

  describe('pop', () => {
    it('emits a new location', (done) => {
      const children = RenderTestSequences.PopEmitsANewLocation(done)
      render(<HashHistory children={children}/>, node)
    })
  })
})

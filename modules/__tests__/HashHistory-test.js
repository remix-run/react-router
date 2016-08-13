import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import HashHistory from '../HashHistory'
import * as RenderTestSequences from './RenderTestSequences'

describe('HashHistory', () => {
  let node
  beforeEach(() => {
    if (window.location.hash !== '')
      window.location.hash = ''

    node = document.createElement('div')
  })

  afterEach(() => {
    unmountComponentAtNode(node)
  })

  describe('push', () => {
    it('emits a PUSH action', (done) => {
      const children = RenderTestSequences.PushEmitsAPushAction(done)
      render(<HashHistory children={children}/>, node)
    })

    it('emits a new location', (done) => {
      const children = RenderTestSequences.PushEmitsANewLocation(done)
      render(<HashHistory children={children}/>, node)
    })
  })

  describe('replace', () => {
    it('emits a REPLACE action', (done) => {
      const children = RenderTestSequences.ReplaceEmitsAReplaceAction(done)
      render(<HashHistory children={children}/>, node)
    })

    it('emits a new location', (done) => {
      const children = RenderTestSequences.ReplaceEmitsANewLocation(done)
      render(<HashHistory children={children}/>, node)
    })
  })

  describe('pop', () => {
    it('emits a POP action', (done) => {
      const children = RenderTestSequences.PopEmitsAPopAction(done)
      render(<HashHistory children={children}/>, node)
    })

    it('emits a new location', (done) => {
      const children = RenderTestSequences.PopEmitsANewLocation(done)
      render(<HashHistory children={children}/>, node)
    })
  })

  describe('block', () => {
    it('blocks a push', (done) => {
      const children = RenderTestSequences.BlockAPush(done)
      render(<HashHistory children={children}/>, node)
    })
  })

  describe('"hashbang" hash encoding', () => {
    it('formats the hash correctly', (done) => {
      const children = RenderTestSequences.HashBangHashEncoding(done)
      render(<HashHistory hashType="hashbang" children={children}/>, node)
    })
  })

  describe('"noslash" hash encoding', () => {
    it('formats the hash correctly', (done) => {
      const children = RenderTestSequences.NoSlashHashEncoding(done)
      render(<HashHistory hashType="noslash" children={children}/>, node)
    })
  })

  describe('"slash" hash encoding', () => {
    it('formats the hash correctly', (done) => {
      const children = RenderTestSequences.SlashHashEncoding(done)
      render(<HashHistory hashType="slash" children={children}/>, node)
    })
  })
})

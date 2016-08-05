import React, { PropTypes } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import MemoryHistory from '../MemoryHistory'
import * as RenderTestSequences from './RenderTestSequences'

const execSteps = (steps, done) => {
  let index = 0

  return (...args) => {
    let value
    try {
      value = steps[index++](...args)

      if (index === steps.length)
        done()
    } catch (error) {
      done(error)
    }

    return value
  }
}

describe('MemoryHistory', () => {
  let node
  beforeEach(() => {
    node = document.createElement('div')
  })

  afterEach(() => {
    unmountComponentAtNode(node)
  })

  describe('push', () => {
    it('emits a new location', (done) => {
      const children = execSteps(RenderTestSequences.PushEmitsANewLocation, done)
      render(<MemoryHistory children={children}/>, node)
    })
  })

  describe('replace', () => {
    it('emits a new location', (done) => {
      const children = execSteps(RenderTestSequences.ReplaceEmitsANewLocation, done)
      render(<MemoryHistory children={children}/>, node)
    })
  })

  describe('pop', () => {
    it('emits a new location', (done) => {
      const children = execSteps(RenderTestSequences.PopEmitsANewLocation, done)
      render(<MemoryHistory children={children}/>, node)
    })
  })
})

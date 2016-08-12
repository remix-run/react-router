import React from 'react'
import expect from 'expect'
import { Push, Pop } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    ({ action }) => {
      expect(action).toBe('POP')
      return <Push path="/hello"/>
    },
    ({ action }) => {
      expect(action).toBe('PUSH')
      return <Pop/>
    },
    ({ action }) => {
      expect(action).toBe('POP')
      return null
    }
  ]

  return createRenderProp(steps, done)
}

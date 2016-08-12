import React from 'react'
import expect from 'expect'
import { Replace } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    ({ action }) => {
      expect(action).toBe('POP')
      return <Replace path="/hello"/>
    },
    ({ action }) => {
      expect(action).toBe('REPLACE')
      return null
    }
  ]

  return createRenderProp(steps, done)
}

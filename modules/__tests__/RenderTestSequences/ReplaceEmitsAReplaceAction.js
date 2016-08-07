import React from 'react'
import expect from 'expect'
import { Replace } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    (location, action) => {
      expect(action).toBe('POP')
      return <Replace path="/hello"/>
    },
    (location, action) => {
      expect(action).toBe('REPLACE')
      return null
    }
  ]

  return createRenderProp(steps, done)
}

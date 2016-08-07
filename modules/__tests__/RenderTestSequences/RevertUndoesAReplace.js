import React from 'react'
import expect from 'expect'
import { Replace, Revert } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    (location, action) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return <Replace path="/hello"/>
    },
    (location, action) => {
      expect(action).toBe('REPLACE')
      expect(location).toMatch({
        path: '/hello'
      })

      return <Revert/>
    },
    (location, action) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return null
    }
  ]

  return createRenderProp(steps, done)
}

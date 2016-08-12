import React from 'react'
import expect from 'expect'
import { Replace, Revert } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    ({ action, location }) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return <Replace path="/hello"/>
    },
    ({ action, location }) => {
      expect(action).toBe('REPLACE')
      expect(location).toMatch({
        path: '/hello'
      })

      return <Revert/>
    },
    ({ action, location }) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return null
    }
  ]

  return createRenderProp(steps, done)
}

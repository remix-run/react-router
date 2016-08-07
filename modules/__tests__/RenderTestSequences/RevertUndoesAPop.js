import React from 'react'
import expect from 'expect'
import { Push, Pop, Revert } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    (location, action) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return <Push path="/hello"/>
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        path: '/hello'
      })

      return <Pop/>
    },
    (location, action) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return <Revert/>
    },
    (location, action) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        path: '/hello'
      })

      return null
    }
  ]

  return createRenderProp(steps, done)
}

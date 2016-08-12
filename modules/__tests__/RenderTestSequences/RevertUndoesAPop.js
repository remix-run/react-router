import React from 'react'
import expect from 'expect'
import { Push, Pop, Revert } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  let keyAfterPush

  const steps = [
    ({ action, location }) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return <Push path="/hello"/>
    },
    ({ action, location }) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        path: '/hello'
      })

      keyAfterPush = location.key

      return <Pop/>
    },
    ({ action, location }) => {
      expect(action).toBe('POP')
      expect(location).toMatch({
        path: '/'
      })

      return <Revert/>
    },
    ({ action, location }) => {
      expect(action).toBe('PUSH')
      expect(location).toMatch({
        path: '/hello',
        key: keyAfterPush
      })

      return null
    }
  ]

  return createRenderProp(steps, done)
}

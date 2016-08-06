import React from 'react'
import expect from 'expect'
import { Push, Replace } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  let keyAfterPush

  const steps = [
    (location) => {
      expect(location).toMatch({
        path: '/',
        key: undefined
      })

      return <Push path="/hello" state={{ the: 'state' }}/>
    },
    (location) => {
      expect(location).toMatch({
        path: '/hello',
        state: { the: 'state' },
        key: /^[0-9a-z]+$/
      })

      keyAfterPush = location.key

      return <Replace path="/goodbye" state={{ more: 'state' }}/>
    },
    (location) => {
      expect(location).toMatch({
        path: '/goodbye',
        state: { more: 'state' },
        key: /^[0-9a-z]+$/
      })

      expect(location.key).toNotBe(keyAfterPush)

      return null
    }
  ]

  return createRenderProp(steps, done)
}

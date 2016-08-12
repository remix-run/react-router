import React from 'react'
import expect from 'expect'
import { Replace } from '../../HistoryActions'
import createRenderProp from './createRenderProp'

export default (done) => {
  const steps = [
    ({ location }) => {
      expect(location).toMatch({
        path: '/'
      })

      return <Replace path="/hello"/>
    },
    ({ location }) => {
      expect(location).toMatch({
        path: '/hello'
      })

      return null
    }
  ]

  return createRenderProp(steps, done)
}

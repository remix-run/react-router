import React from 'react'
import expect from 'expect'
import { Replace } from '../../HistoryActions'

export default [
  (location) => {
    expect(location).toMatch({
      path: '/',
      state: undefined,
      key: undefined
    })

    return <Replace path="/hello" state={{ the: 'state' }}/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/hello',
      state: { the: 'state' },
      key: /^[0-9a-z]+$/
    })

    return null
  }
]

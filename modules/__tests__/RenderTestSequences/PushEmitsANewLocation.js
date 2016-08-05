import React from 'react'
import expect from 'expect'
import { Push } from '../../HistoryActions'

export default [
  (location) => {
    expect(location).toMatch({
      path: '/',
      state: undefined,
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

    return null
  }
]

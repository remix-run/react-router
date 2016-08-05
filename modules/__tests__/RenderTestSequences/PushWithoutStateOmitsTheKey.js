import React from 'react'
import expect from 'expect'
import { Push } from '../../HistoryActions'

export default [
  (location) => {
    expect(location).toMatch({
      path: '/'
    })

    return <Push path="/hello"/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/hello',
      key: undefined
    })

    return null
  }
]

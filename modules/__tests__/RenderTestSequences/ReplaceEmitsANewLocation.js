import React from 'react'
import expect from 'expect'
import { Replace } from '../../HistoryActions'

export default [
  (location) => {
    expect(location).toMatch({
      path: '/'
    })

    return <Replace path="/hello"/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/hello'
    })

    return null
  }
]

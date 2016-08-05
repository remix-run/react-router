import React from 'react'
import expect from 'expect'
import { Push, Pop } from '../../HistoryActions'

export default [
  (location) => {
    expect(location).toMatch({
      path: '/',
      state: undefined,
      key: undefined
    })

    return <Push path="/hello"/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/hello',
      state: undefined,
      key: /^[0-9a-z]+$/
    })

    return <Pop n={-1}/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/',
      state: undefined,
      key: undefined
    })

    return null
  }
]

import React from 'react'
import expect from 'expect'
import { Push, Pop } from '../../HistoryActions'

export default [
  (location) => {
    expect(location).toMatch({
      path: '/'
    })

    return <Push path="/hello"/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/hello'
    })

    return <Pop go={-1}/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/'
    })

    return null
  }
]

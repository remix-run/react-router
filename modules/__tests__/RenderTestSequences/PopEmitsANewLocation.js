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

    return <Pop n={-1}/>
  },
  (location) => {
    expect(location).toMatch({
      path: '/'
    })

    return null
  }
]

import React from 'react'
import expect from 'expect'
import { Push, Pop } from '../../HistoryActions'

export default [
  () => {
    // IE 10+ gives us "#", everyone else gives us ""
    expect(window.location.hash).toMatch(/^#?$/)
    return <Push path="/hello"/>
  },
  () => {
    expect(window.location.hash).toBe('#hello')
    return <Pop go={-1}/>
  },
  () => {
    // IE 10+ gives us "#", everyone else gives us ""
    expect(window.location.hash).toMatch(/^#?$/)
    return <Pop go={1}/>
  },
  () => {
    expect(window.location.hash).toBe('#hello')
    return null
  }
]

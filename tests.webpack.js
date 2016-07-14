/* eslint-env mocha */
/* eslint-disable no-console */

import expect from 'expect'

import { _resetWarned } from './modules/routerWarning'

beforeEach(() => {
  expect.spyOn(console, 'error').andCall(msg => {
    for (const about of console.error.expected) {
      if (msg.indexOf(about) !== -1) {
        console.error.warned[about] = true
        return
      }
    }

    console.error.threw = true
    throw new Error(msg)
  })

  console.error.expected = []
  console.error.warned = Object.create(null)
  console.error.threw = false
})

afterEach(() => {
  if (!console.error.threw) {
    console.error.expected.forEach(about => {
      expect(console.error.warned[about]).toExist(
        `Missing expected warning: ${about}`
      )
    })
  }

  console.error.restore()
  _resetWarned()
})

const context = require.context('./modules', true, /-test\.js$/)
context.keys().forEach(context)

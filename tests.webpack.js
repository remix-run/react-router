/* eslint-disable no-console */
/* eslint-env mocha */

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

    throw new Error(msg)
  })

  console.error.expected = []
  console.error.warned = Object.create(null)
})

afterEach(() => {
  console.error.expected.forEach(about => {
    expect(console.error.warned[about]).toExist(
      `Missing expected warning: ${about}`
    )
  })

  console.error.restore()
  _resetWarned()
})

const context = require.context('./modules', true, /-test\.js$/)
context.keys().forEach(context)

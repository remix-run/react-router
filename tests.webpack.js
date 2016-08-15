/* eslint-env mocha */

import 'babel-polyfill'
import expect from 'expect'

import { _resetWarned } from './modules/routerWarning'

beforeEach(() => {
  /* eslint-disable no-console */
  expect.spyOn(console, 'error').andCall(msg => {
    let expected = false

    console.error.expected.forEach(about => {
      if (msg.indexOf(about) !== -1) {
        console.error.warned[about] = true
        expected = true
      }
    })

    if (expected)
      return

    console.error.threw = true
    throw new Error(msg)
  })

  console.error.expected = []
  console.error.warned = Object.create(null)
  console.error.threw = false
  /* eslint-enable no-console */
})

afterEach(() => {
  /* eslint-disable no-console */
  const { threw, expected, warned } = console.error
  console.error.restore()

  if (!threw) {
    expected.forEach(about => {
      expect(warned[about]).toExist(`Missing expected warning: ${about}`)
    })
  }
  /* eslint-enable no-console */

  _resetWarned()
})

const context = require.context('./modules', true, /-test\.js$/)
context.keys().forEach(context)

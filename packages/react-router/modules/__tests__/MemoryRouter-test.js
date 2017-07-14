import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import MemoryRouter from '../MemoryRouter'

describe('A <MemoryRouter>', () => {
  it('puts history on context.router', () => {
    let history
    const ContextChecker = (props, context) => {
      history = context.router.history
      return null
    }

    ContextChecker.contextTypes = {
      router: PropTypes.object.isRequired
    }

    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter>
        <ContextChecker/>
      </MemoryRouter>
    ), node)

    expect(history).toBeAn('object')
  })

  it('warns when passed a history prop', () => {
    const history = {}
    const node = document.createElement('div')
    expect.spyOn(console, 'error')

    ReactDOM.render((
      <MemoryRouter history={history} />
    ), node)

    expect(console.error.calls.length).toBe(1)
    expect(console.error.calls[0].arguments[0]).toMatch(
      /<MemoryRouter.*import \{ Router }/)
    expect.restoreSpies()
  })
})

import expect from 'expect'
import React from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import HashRouter from '../HashRouter'

describe('A <HashRouter>', () => {
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
      <HashRouter>
        <ContextChecker/>
      </HashRouter>
    ), node)

    expect(history).toBeAn('object')
  })

  it('warns when passed a history prop', () => {
    const history = {}
    const node = document.createElement('div')
    expect.spyOn(console, 'error')

    ReactDOM.render((
      <HashRouter history={history} />
    ), node)

    expect(console.error.calls.length).toBe(1)
    expect(console.error.calls[0].arguments[0]).toMatch(
      /<HashRouter.*import \{ Router }/)
    expect.restoreSpies()
  })
})

import expect from 'expect'
import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import HashRouter from '../HashRouter'

describe('A <HashRouter>', () => {
  it('puts history on context', () => {
    let history
    const ContextChecker = (props, context) => {
      history = context.history
      return null
    }

    ContextChecker.contextTypes = {
      history: PropTypes.object.isRequired
    }

    const node = document.createElement('div')

    ReactDOM.render((
      <HashRouter>
        <ContextChecker/>
      </HashRouter>
    ), node)

    expect(history).toBeAn('object')
  })
})

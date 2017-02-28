import expect from 'expect'
import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import BrowserRouter from '../BrowserRouter'

describe('A <BrowserRouter>', () => {
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
      <BrowserRouter>
        <ContextChecker/>
      </BrowserRouter>
    ), node)

    expect(history).toBeAn('object')
  })
})

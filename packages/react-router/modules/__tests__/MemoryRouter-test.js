import expect from 'expect'
import React, { PropTypes } from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'

describe('A <MemoryRouter>', () => {
  it('puts a router on context', () => {
    let router
    const ContextChecker = (props, context) => {
      router = context.router
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

    expect(router).toBeAn('object')
  })
})

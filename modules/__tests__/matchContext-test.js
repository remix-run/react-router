import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Route from '../Route'
import matchProvider from '../matchProvider'
import withMatch from '../withMatch'
import MemoryRouter from '../MemoryRouter'

describe('match higher-order components', () => {
  const div = document.createElement('div')

  afterEach(() => {
    unmountComponentAtNode(div)
  })

  describe('matchProvider', () => {
    it('makes match available through the context', () => {
      const match = { path: '/foo' }

      const ContextChecker = (props, context) => {
        expect(context.match).toEqual(match)
        return null
      }
      ContextChecker.contextTypes = {
        match: React.PropTypes.object
      }

      const Parent = () => (
        <ContextChecker />
      )

      render((
        <MemoryRouter>
          <Route match={match} component={matchProvider(Parent)} />
        </MemoryRouter>
      ), div)
    })

    it('renders the component, passing it all of its props', () => {
      const match = { path: '/foo' }
      
      const Parent = (props) => {
        expect(props).toIncludeKeys(['match', 'history'])
        return null
      }

      render((
        <MemoryRouter>
          <Route match={match} component={matchProvider(Parent)} />
        </MemoryRouter>
      ), div)
    })
  })

  describe('withMatch', () => {
    it('injects context.match as a prop', () => {
      const match = { path: '/foo' }

      const ContextChecker = withMatch((props) => {
        expect(props.match).toEqual(match)
        return null
      })

      const Parent = () => (
        <ContextChecker />
      )

      render((
        <MemoryRouter>
          <Route match={match} component={matchProvider(Parent)} />
        </MemoryRouter>
      ), div)      
    })
  })
})

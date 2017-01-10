import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import MatchRoutes from '../MatchRoutes'
import Router from '../MemoryRouter'

describe('MatchRoutes', () => {
  const div = document.createElement('div')

  const HOME = 'HOME'
  const Home = () => <div>{HOME}</div>

  const FOO = 'FOO'
  const Foo = () => <div>{FOO}</div>

  const NO_MATCH = 'NO_MATCH'
  const NoMatch = () => <div>{NO_MATCH}</div>

  const App = ({ pathname }) => (
    <Router initialEntries={[{ pathname }]}>
      <MatchRoutes
        routes={[
          { pattern: '/',
            exact: true,
            component: Home
          },
          { pattern: '/foo',
            component: Foo
          }
        ]}
        missComponent={NoMatch}
      />
    </Router>
  )

  afterEach(() => unmountComponentAtNode(div))

  it('renders the first matching child', () => {
    render(<App pathname="/"/>, div, () => {
      expect(div.innerHTML).toContain(HOME)
    })
  })

  it('renders the first matching child that is not the first child', () => {
    render(<App pathname="/foo"/>, div, () => {
      expect(div.innerHTML).toContain(FOO)
    })
  })

  it('renders a miss when nothing else matches', () => {
    render(<App pathname="/no-match"/>, div, () => {
      expect(div.innerHTML).toContain(NO_MATCH)
    })
  })
})


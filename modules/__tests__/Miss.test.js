import expect from 'expect'
import React from 'react'
import Miss from '../Miss'
import Match from '../Match'
import { render, unmountComponentAtNode } from 'react-dom'
import MemoryRouter from '../MemoryRouter'

describe('Miss', () => {
  const TEXT = 'TEXT'
  const loc = { pathname: '/', search: '', hash: '', state: TEXT }

  it('renders a Component prop', (done) => {
    const div = document.createElement('div')
    const Page = () => <div>{TEXT}</div>
    render((
      <MemoryRouter initialEntries={[ loc ]}>
        <Miss component={Page} />
      </MemoryRouter>
    ), div, () => {
      expect(div.innerHTML).toContain(TEXT)
      unmountComponentAtNode(div)
      done()
    })
  })

  it('renders a render prop passes a location', (done) => {
    const div = document.createElement('div')
    render((
      <MemoryRouter initialEntries={[ loc ]}>
        <Miss render={({ location }) => (
          <div>{location.state}</div>
        )}/>
      </MemoryRouter>
    ), div, () => {
      expect(div.innerHTML).toContain(TEXT)
      unmountComponentAtNode(div)
      done()
    })
  })

  describe('with a nested pattern', () => {
    const MATCH = 'MATCH'

    const App = ({ location }) => (
      <MemoryRouter initialEntries={[location]} initialIndex={0}>
        <Match pattern='/parent' component={Parent} />
      </MemoryRouter>
    )

    const Parent = () => (
      <div>
        <Match pattern='child' exactly={true} component={() => <div>{MATCH}</div>} />
        <Miss component={() => <div>{TEXT}</div>} />
      </div>
    )

    it('does not render on match', (done) => {
      const div = document.createElement('div')
      const nestedLoc = { pathname: '/parent/child' }

      render(<App location={nestedLoc} />, div, () => {
        expect(div.innerHTML).toNotContain(TEXT)
        expect(div.innerHTML).toContain(MATCH)
        done()
      })
    })

    it('does render on non-exact match', (done) => {
      const div = document.createElement('div')
      const nestedLoc = { pathname: '/parent/child/foobar' }

      render(<App location={nestedLoc} />, div, () => {
        expect(div.innerHTML).toContain(TEXT)
        expect(div.innerHTML).toNotContain(MATCH)
        done()
      })
    })
  })
})

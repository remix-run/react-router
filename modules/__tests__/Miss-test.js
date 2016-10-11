import expect from 'expect'
import React from 'react'
import Miss from '../Miss'
import Match from '../Match'
import { render, unmountComponentAtNode } from 'react-dom'
import MatchProvider from '../MatchProvider'
import MemoryRouter from '../MemoryRouter'

const MATCH = 'MATCH'
const MISS = 'MISS'
const MatchComp = () => <div>{MATCH}</div>
const MissComp = () => <div>{MISS}</div>

describe('Miss', () => {
  const TEXT = 'TEXT'
  const loc = { pathname: '/', search: '', hash: '', state: TEXT }

  it('renders a Component prop', (done) => {
    const div = document.createElement('div')
    const Page = () => <div>{TEXT}</div>
    render((
      <MatchProvider>
        <Miss
          location={loc}
          component={Page}
        />
      </MatchProvider>
    ), div, () => {
      expect(div.innerHTML).toContain(TEXT)
      unmountComponentAtNode(div)
      done()
    })
  })

  it('renders a render prop passes a location', (done) => {
    const div = document.createElement('div')
    render((
      <MatchProvider>
        <Miss
          location={loc}
          render={({ location }) => (
            <div>{location.state}</div>
          )}
        />
      </MatchProvider>
    ), div, () => {
      expect(div.innerHTML).toContain(TEXT)
      unmountComponentAtNode(div)
      done()
    })
  })

  it('renders null when out of context', (done) => {
    const div = document.createElement('div')
    const Page = () => <div>{TEXT}</div>
    render((
      <Miss
        location={loc}
        component={Page}
      />
    ), div, () => {
      expect(div.innerHTML).toNotContain(TEXT)
      unmountComponentAtNode(div)
      done()
    })
  })

  describe('with a nested pattern', () => {
    const App = ({ location, component }) => (
      <MemoryRouter initialEntries={[location]} initialIndex={0}>
        <Match pattern='/parent' component={component || Parent} />
      </MemoryRouter>
    )

    const Parent = () => (
      <div>
        <Match pattern='child' exactly={true} component={MatchComp} />
        <Miss component={MissComp} />
      </div>
    )

    it('does not render on match', (done) => {
      const div = document.createElement('div')
      const nestedLoc = { pathname: '/parent/child' }

      render(<App location={nestedLoc} />, div, () => {
        expect(div.innerHTML).toNotContain(MISS)
        expect(div.innerHTML).toContain(MATCH)
        done()
      })
    })

    it('does render on non-exact match', (done) => {
      const div = document.createElement('div')
      const nestedLoc = { pathname: '/parent/child/foobar' }

      render(<App location={nestedLoc} />, div, () => {
        expect(div.innerHTML).toContain(MISS)
        expect(div.innerHTML).toNotContain(MATCH)
        done()
      })
    })
  })

  describe('on first render pass', () => {
    const Routes = () => (
      <div>
        <Match pattern='/test' exactly={true} component={MatchComp} />
        <Miss component={MissComp} />
      </div>
    )
    const App = ({ location, component = <Routes /> }) => {
      return (
        <MemoryRouter initialEntries={[location]} initialIndex={0}>
          {component}
        </MemoryRouter>
      )
    }

    // Force miss components to only render ONCE to check the result after one pass
    beforeEach(() => {
      Miss.prototype.shouldComponentUpdate = () => false
    })
    afterEach(() => {
      delete Miss.prototype.shouldComponentUpdate
    })

    it('miss renders when there are no matches', (done) => {
      const div = document.createElement('div')
      const loc = { pathname: '/no-match' }

      render(<App location={loc} />, div, () => {
        expect(div.innerHTML).toContain(MISS)
        expect(div.innerHTML).toNotContain(MATCH)
        done()
      })
    })

    it('does not render misses on first pass when matches', (done) => {
      const div = document.createElement('div')
      const loc = { pathname: '/test' }
      render(<App location={loc} />, div, () => {
        expect(div.innerHTML).toNotContain(MISS)
        expect(div.innerHTML).toContain(MATCH)
        done()
      })
    })

    it('show misses render on first pass when before matched elements', (done) => {
      const div = document.createElement('div')
      const loc = { pathname: '/test' }
      const RoutesInverted = () => (
        <div>
          <Miss component={MissComp} />
          <Match pattern='/test' exactly={true} component={MatchComp} />
        </div>
      )
      render(<App location={loc} component={RoutesInverted} />, div, () => {
        expect(div.innerHTML).toContain(MISS)
        expect(div.innerHTML).toContain(MATCH)
        done()
      })
    })
  })
})

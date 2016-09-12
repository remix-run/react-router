import expect from 'expect'
import React from 'react'
import Miss from '../Miss'
import { render, unmountComponentAtNode } from 'react-dom'
import MatchProvider from '../MatchProvider'

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
})

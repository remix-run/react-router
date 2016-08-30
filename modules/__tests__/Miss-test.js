import expect from 'expect'
import React from 'react'
import Miss from '../Miss'
import { renderToString } from 'react-dom/server'
import MatchProvider from '../MatchProvider'

describe('Miss', () => {
  const TEXT = 'TEXT'

  it('renders a Component prop', () => {
    const Page = () => <div>{TEXT}</div>
    const html = renderToString(
      <MatchProvider>
        <Miss
          location={{}}
          component={Page}
        />
      </MatchProvider>
    )
    expect(html).toContain(TEXT)
  })

  it('renders a render prop passes a location', () => {
    const loc = { state: TEXT }
    const html = renderToString(
      <MatchProvider>
        <Miss
          location={loc}
          render={({ location }) => (
            <div>{location.state}</div>
          )}
        />
      </MatchProvider>
    )
    expect(html).toContain(TEXT)
  })

  it('renders null when out of context', () => {
    const Page = () => <div>{TEXT}</div>
    const html = renderToString(
      <Miss
        location={{}}
        component={Page}
      />
    )
    expect(html).toNotContain(TEXT)
  })
})

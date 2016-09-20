import expect from 'expect'
import React, { PropTypes } from 'react'
import MatchProvider from '../MatchProvider'
import Match from '../Match'
import { renderToString } from 'react-dom/server'
import { render } from 'react-dom'


describe('MatchProvider', () => {

  it('works with multiple routes', () => {
    const TEXT = 'TEXT'
    const location = { pathname: '/test', state: { test: TEXT } }
    const html = renderToString(
      <MatchProvider>
        <Match exactly pattern="/" location={location} render={() => (
          <div></div>
        )}/>
        <Match exactly pattern="/test" location={location} render={() => (
          <div>{location.state.test}</div>
        )}/>
      </MatchProvider>
    )
    expect(html).toContain(TEXT)
  })

});

import expect from 'expect'
import React from 'react'
import Router from '../ServerRouter'
import Match from '../Match'
import Redirect from '../Redirect'
import { renderToString } from 'react-dom/server'

describe.skip('ServerRouter', () => {

  it('renders at a location', () => {
    expect(renderToString(
      <Router location="/test" onRedirect={() => {}}>
        <Match pattern="/test" render={() => <div>found me</div>}/>
      </Router>
    )).toContain('found me')
  })

  it('calls `onRedirect` when redirected', () => {
    let redirectLocation

    const html = renderToString(
      <Router
        location="/"
        onRedirect={location => redirectLocation = location}
      >
        <Match pattern="/" exactly render={() => (
          <Redirect to="/dashboard"/>
        )}/>
        <Match pattern="/dashboard" render={() => (
          <div>do not find</div>
        )}/>
      </Router>
    )

    expect(redirectLocation).toExist()
    expect(redirectLocation.action).toEqual('REPLACE')
    expect(redirectLocation.pathname).toEqual('/dashboard')
    expect(html).toNotContain('do not find')
  })

  it('calls `onRedirect` with only the first redirect', () => {
    let redirectLocation

    const html = renderToString(
      <Router
        location="/"
        onRedirect={location => redirectLocation = location}
      >
        <Match pattern="/" exactly render={() => (
          <Redirect to="/dashboard"/>
        )}/>
        <Match pattern="/dashboard" render={() => (
          <Redirect to="/favorites "/>
        )}/>
        <Match pattern="/favorites" render={() => (
          <div>do not find</div>
        )}/>
      </Router>
    )

    expect(redirectLocation).toExist()
    expect(redirectLocation.pathname).toEqual('/dashboard')
    expect(html).toNotContain('do not find')
  })
})


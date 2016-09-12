import expect from 'expect'
import React from 'react'
import ServerRouter from '../ServerRouter'
import Redirect from '../Redirect'
import Miss from '../Miss'
import { renderToString } from 'react-dom/server'

describe('ServerRouter', () => {

  it('puts redirects on server render result', () => {
    const result = {}

    renderToString(
      <ServerRouter
        result={result}
        location="/"
      >
        <Redirect to={{
          pathname: '/somewhere-else',
          state: { status: 302 }
        }}/>
      </ServerRouter>
    )
    expect(result).toEqual({
      redirect: {
        location: '/somewhere-else',
        state: { status: 302 }
      }
    })
  })

  it.skip('puts misses on server render result', () => {
    const result = {}

    renderToString(
      <ServerRouter
        result={result}
        location="/anywhere"
      >
        <Miss render={() => (
          <div>hi</div>
        )}/>
      </ServerRouter>
    )
    expect(result).toEqual({
      misses: [ 0, 2 ]
    })
  })

  it.skip('renders misses from server result', () => {
    const result = { misses: [ 0 ] }

    const markup = renderToString(
      <ServerRouter
        result={result}
        location="/anywhere"
      >
        <Miss render={() => (
          <div>test</div>
        )}/>
      </ServerRouter>
    )

    expect(markup).toContain('test')
  })

})

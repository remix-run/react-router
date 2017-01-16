import expect from 'expect'
import React from 'react'
import ServerRouter from '../ServerRouter'
import Redirect from '../Redirect'
import Route from '../Route'
import { renderToString } from 'react-dom/server'

describe('ServerRouter', () => {

  it('puts redirects on server render result', () => {
    const context = {}
    const REPLACE_LOCATION = '/somewhere-else'
    renderToString(
      <ServerRouter
        context={context}
        url="/"
      >
        <Redirect to={{
          pathname: REPLACE_LOCATION,
          state: { status: 302 }
        }}/>
      </ServerRouter>
    )
    expect(context.action).toEqual('REPLACE')
    expect(context.location.pathname).toEqual(REPLACE_LOCATION)
  })
})

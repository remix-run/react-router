import expect from 'expect'
import React from 'react'
import ServerRouter from '../ServerRouter'
import Redirect from '../Redirect'
import Miss from '../Miss'
import { renderToString } from 'react-dom/server'

describe('ServerRouter', () => {

  it('calls `onRedirect` with location and state', () => {
    let redirectLocation
    let redirectState

    renderToString(
      <ServerRouter
        location="/"
        onRedirect={(location, state) => {
          redirectLocation = location
          redirectState = state
        }}
      >
        <Redirect to={{
          pathname: '/somewhere-else',
          state: { status: 302 }
        }}/>
      </ServerRouter>
    )
    expect(redirectLocation).toExist()
    expect(redirectState).toExist()
    expect(redirectLocation).toEqual('/somewhere-else')
    expect(redirectState).toEqual({ status: 302 })
  })

  it('calls `onMiss` with the location', () => {
    let missLocation

    renderToString(
      <ServerRouter
        location="/anywhere"
        onRedirect={() => {}}
        onMiss={(location) => {
          missLocation = location
        }}
      >
        <Miss render={() => (
          <div>hi</div>
        )}/>
      </ServerRouter>
    )
    expect(missLocation).toExist()
    expect(missLocation.pathname).toEqual('/anywhere')
  })

})

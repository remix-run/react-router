import expect from 'expect'
import React from 'react'
import ServerRouter from '../ServerRouter'
import Redirect from '../Redirect'
import Match from '../Match'
import Miss from '../Miss'
import { renderToString } from 'react-dom/server'

describe('ServerRouter', () => {

  it('puts redirects on server render result', () => {
    const context = {}

    renderToString(
      <ServerRouter
        context={context}
        location="/"
      >
        <Redirect to={{
          pathname: '/somewhere-else',
          state: { status: 302 }
        }}/>
      </ServerRouter>
    )
    expect(context.redirect).toEqual({
      pathname: '/somewhere-else',
      state: { status: 302 },
      query: null,
      search: '',
      hash: '',
      key: undefined
    })
  })

  it('renders misses', (done) => {
    const NO = 'NO'
    const YES1 = 'YES1'
    const YES2 = 'YES2'
    const location = '/nowhere'
    const App = () => (
      <div>
        <Match pattern="/" render={() => (
          <div>
            <Miss render={() => (
              <div>{YES1}</div>
            )}/>
            <Miss render={() => (
              <div>{YES2}</div>
            )}/>
          </div>
        )}/>
        <Miss render={() => <div>{NO}</div>}/>
      </div>
    )

    const context = {}

    const markup = renderToString(
      <ServerRouter context={context} location={location}>
        <App/>
      </ServerRouter>
    )

    expect(context.missed).toBe(true)
    expect(markup).toContain(YES1)
    expect(markup).toContain(YES2)
    expect(markup).toNotContain(NO)
    done()
  })

})

import expect from 'expect'
import React, { PropTypes } from 'react'
import ReactDOMServer from 'react-dom/server'
import StaticRouter from '../StaticRouter'
import Redirect from '../Redirect'

describe('A <StaticRouter>', () => {
  it('puts a router on context', () => {
    let router
    const ContextChecker = (props, context) => {
      router = context.router
      return null
    }

    ContextChecker.contextTypes = {
      router: PropTypes.object.isRequired
    }

    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <ContextChecker/>
      </StaticRouter>
    )

    expect(router).toBeAn('object')
  })

  it('reports PUSH actions on the context object', () => {
    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Redirect push to="/somewhere-else"/>
      </StaticRouter>
    )

    expect(context.action).toBe('PUSH')
    expect(context.url).toBe('/somewhere-else')
  })

  it('reports REPLACE actions on the context object', () => {
    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Redirect to="/somewhere-else"/>
      </StaticRouter>
    )

    expect(context.action).toBe('REPLACE')
    expect(context.url).toBe('/somewhere-else')
  })

  it('knows how to serialize location objects', () => {
    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Redirect to={{ pathname: '/somewhere-else' }}/>
      </StaticRouter>
    )

    expect(context.action).toBe('REPLACE')
    expect(context.location.pathname).toBe('/somewhere-else')
    expect(context.location.search).toBe('')
    expect(context.location.hash).toBe('')
    expect(context.url).toBe('/somewhere-else')
  })

  it('knows how to parse raw URLs', () => {
    let location
    const LocationSubject = (props, context) => {
      location = context.router.location
      return null
    }

    LocationSubject.contextTypes = {
      router: PropTypes.object.isRequired
    }

    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter location="/the/path?the=query#the-hash" context={context}>
        <LocationSubject/>
      </StaticRouter>
    )

    expect(location).toMatch({
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash'
    })
  })
})

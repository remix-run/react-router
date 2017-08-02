import React from 'react'
import ReactDOM from 'react-dom'
import ReactDOMServer from 'react-dom/server'
import PropTypes from 'prop-types'
import StaticRouter from '../StaticRouter'
import Redirect from '../Redirect'
import Route from '../Route'
import Prompt from '../Prompt'

describe('A <StaticRouter>', () => {
  it('provides context.router.staticContext in props.staticContext', () => {
    const ContextChecker = (props, reactContext) => {
      expect(typeof reactContext.router).toBe('object')
      expect(reactContext.router.staticContext).toBe(props.staticContext)
      return null
    }

    ContextChecker.contextTypes = {
      router: PropTypes.object.isRequired
    }

    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Route component={ContextChecker}/>
      </StaticRouter>
    )
  })

  it('context.router.staticContext persists inside of a <Route>', () => {
    const ContextChecker = (props, reactContext) => {
      expect(typeof reactContext.router).toBe('object')
      expect(reactContext.router.staticContext).toBe(context)
      return null
    }

    ContextChecker.contextTypes = {
      router: PropTypes.object.isRequired
    }

    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context}>
        <Route component={ContextChecker}/>
      </StaticRouter>
    )
  })

  it('provides context.router.history', () => {
    const ContextChecker = (props, reactContext) => {
      expect(typeof reactContext.router.history).toBe('object')
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
  })

  it('warns when passed a history prop', () => {
    const context = {}
    const history = {}
    const node = document.createElement('div')

    spyOn(console, 'error')

    ReactDOM.render((
      <StaticRouter context={context} history={history} />
    ), node)

    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('<StaticRouter> ignores the history prop')
    )
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
    const LocationChecker = (props) => {
      expect(props.location).toMatchObject({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })
      return null
    }

    const context = {}

    ReactDOMServer.renderToStaticMarkup(
      <StaticRouter context={context} location="/the/path?the=query#the-hash">
        <Route component={LocationChecker}/>
      </StaticRouter>
    )
  })

  describe('with a basename', () => {
    it('strips the basename from location pathnames', () => {
      const LocationChecker = (props) => {
        expect(props.location).toMatchObject({
          pathname: '/path'
        })
        return null
      }

      const context = {}

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter context={context} basename="/the-base" location="/the-base/path">
          <Route component={LocationChecker}/>
        </StaticRouter>
      )
    })

    it('reports PUSH actions on the context object', () => {
      const context = {}

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter context={context} basename="/the-base">
          <Redirect push to="/somewhere-else"/>
        </StaticRouter>
      )

      expect(context.action).toBe('PUSH')
      expect(context.url).toBe('/the-base/somewhere-else')
    })

    it('reports REPLACE actions on the context object', () => {
      const context = {}

      ReactDOMServer.renderToStaticMarkup(
        <StaticRouter context={context} basename="/the-base">
          <Redirect to="/somewhere-else"/>
        </StaticRouter>
      )

      expect(context.action).toBe('REPLACE')
      expect(context.url).toBe('/the-base/somewhere-else')
    })
  })

  describe('no basename', () => {
    it('createHref does not append extra leading slash', () => {
      const context = {}
      const node = document.createElement('div')
      const pathname = '/test-path-please-ignore'

      const Link = ({ to, children }) => (
        <Route children={({ history: { createHref } }) => (
          <a href={createHref(to)}>{children}</a>
        )} />
      )

      ReactDOM.render((
        <StaticRouter context={context}>
          <Link to={pathname} />
        </StaticRouter>
      ), node)

      const a = node.getElementsByTagName('a')[0]
      expect(a.getAttribute('href')).toEqual(pathname)
    })
  })

  describe('render a <Prompt>', () => {
    it('does nothing', () => {
      const context = {}
      const node = document.createElement('div')

      expect(() => {
        ReactDOM.render((
          <StaticRouter context={context}>
            <Prompt message="this is only a test"/>
          </StaticRouter>
        ), node)
      }).not.toThrow()
    })
  })

})

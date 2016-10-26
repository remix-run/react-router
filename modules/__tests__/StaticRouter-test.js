import expect from 'expect'
import React from 'react'
import StaticRouter from '../StaticRouter'
import { routerContext as routerContextType } from '../PropTypes'
import { renderToString } from 'react-dom/server'

//console.error = () => {}

// query-string parse creates object with no prototype
const noPrototypeObj = (obj) => {
  const noProto = Object.create(null)
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      noProto[key] = obj[key]
    }
  }
  return noProto
}

describe('StaticRouter', () => {

  const requiredProps = {
    location: '/',
    action: 'POP',
    createHref: () => {},
    blockTransitions: () => {}, // we sure we want this required? servers don't need it.
    onPush: () => {},
    onReplace: () => {}
  }

  describe('rendering', () => {
    it('renders static children', () => {
      expect(renderToString(
        <StaticRouter {...requiredProps}>
          <div>test</div>
        </StaticRouter>
      )).toContain('test')
    })

    it('passes the location to function children', () => {
      let actualLocation
      renderToString(
        <StaticRouter {...requiredProps} location="/lol">
          {({ location }) => <div>{(actualLocation = location, null)}</div>}
        </StaticRouter>
      )
      const expected = {
        hash: '',
        pathname: '/lol',
        search: '',
        query: null
      }
      expect(actualLocation).toEqual(expected)
    })

    it('passes the action to function children', () => {
      let actualAction
      renderToString(
        <StaticRouter {...requiredProps} location="/lol">
          {({ action }) => <div>{(actualAction = action, null)}</div>}
        </StaticRouter>
      )
      expect(actualAction).toBe('POP')
    })    
  })

  describe('location prop', () => {
    it('parses string `location` into a real location', () => {
      let actualLocation
      renderToString(
        <StaticRouter
          {...requiredProps}
          location="/lol?foo=bar"
        >
          {({ location }) => (
            <div>{(actualLocation = location, null)}</div>
          )}
        </StaticRouter>
      )
      const expected = {
        hash: '',
        pathname: '/lol',
        search: '?foo=bar',
        query: noPrototypeObj({ foo: 'bar' })
      }
      expect(actualLocation).toEqual(expected)
    })

  })

  describe('basename support', () => {
    class Test extends React.Component {
      static contextTypes = {
        router: routerContextType
      }

      render() {
        return <div>{this.context.router.createHref(this.props.to)}</div>
      }
    }

    const BASENAME = "/foo"
    const routerProps = {
      location: '/',
      action: 'POP',
      onPush: () => {},
      onReplace: () => {}
    }

    it('uses the basename when creating hrefs', () => {
      expect(renderToString(
        <StaticRouter {...routerProps} basename={BASENAME}>
          <Test to='/bar' />
        </StaticRouter>
      )).toContain(BASENAME)
    })

    it('does not append a trailing slash to the root path', () => {
      expect(renderToString(
        <StaticRouter {...routerProps} basename={BASENAME}>
        <Test to='/' />
        </StaticRouter>
      )).toContain('/foo</div>')
    })

    it('does not append a trailing slash to the root path if a query is specified', () => {
      expect(renderToString(
        <StaticRouter {...routerProps} basename={BASENAME}>
        <Test to={{pathname:'/', query:{a:1}}} />
        </StaticRouter>
      )).toContain('/foo?a=1</div>')
    })
  })

  describe('router prop', () => {
    describe('`.blockTransitions()`', () => {
      it('returns a teardown function', () => {
        let teardownPrompt
        renderToString(
          <StaticRouter
            {...requiredProps}
            blockTransitions={() => () => {}}
          >
            {({ router }) => (
              <div>{teardownPrompt = router.blockTransitions('Are you sure?')}</div>
            )}
          </StaticRouter>
        )
        expect(teardownPrompt).toExist()
        expect(teardownPrompt).toBeA('function')
      })
    })
  })
})

import expect from 'expect'
import React from 'react'
import StaticRouter from '../StaticRouter'
import { routerContext as routerContextType } from '../PropTypes'
import { renderToString } from 'react-dom/server'

//console.error = () => {}

// is there a bug in expect? I thought it handled nested objects
const expectDeepEquality = (actual, expected) => {
  Object.keys(actual).forEach(key => {
    if (typeof actual[key] === 'object' && actual[key] != null) {
      expectDeepEquality(actual[key], expected[key])
    } else {
      expect(actual[key]).toEqual(expected[key])
    }
  })
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
      expectDeepEquality(actualLocation, {
        action: 'POP',
        hash: '',
        key: null,
        pathname: '/lol',
        search: '',
        query: null,
        state: null
      })
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
        action: 'POP',
        hash: '',
        pathname: '/lol',
        search: '?foo=bar',
        query: { foo: 'bar' },
        state: null
      }
      expectDeepEquality(actualLocation, expected)
    })

    describe('location descriptors', () => {
      const assertParsedDescriptor = (loc, expected) => {
        let actualLocation
        renderToString(
          <StaticRouter {...requiredProps} location={loc}>
            {({ location }) => <div>{(actualLocation = location, null)}</div>}
          </StaticRouter>
        )

        expectDeepEquality(actualLocation, expected)
      }

      it('adds default properties', () => {
        assertParsedDescriptor({}, {
          pathname: '',
          query: null,
          hash: '',
          state: null,
          search: ''
        })
      })

      it('parses query to add search', () => {
        assertParsedDescriptor({
          query: { a: 'b' }
        }, {
          pathname: '',
          query: { a: 'b' },
          hash: '',
          state: null,
          search: '?a=b'
        })
      })

      it('stringifies search to add query', () => {
        assertParsedDescriptor({
          search: '?a=b'
        }, {
          pathname: '',
          query: { a: 'b' },
          hash: '',
          state: null,
          search: '?a=b'
        })
      })

      it('uses search if provided', () => {
        assertParsedDescriptor({
          search: '?a=b'
        }, {
          pathname: '',
          query: { a: 'b' },
          hash: '',
          state: null,
          search: '?a=b'
        })
      })

      it('uses query if provided', () => {
        assertParsedDescriptor({
          query: { a: 'b' }
        }, {
          pathname: '',
          query: { a: 'b' },
          hash: '',
          state: null,
          search: '?a=b'
        })
      })

      it('uses pathname if provided', () => {
        assertParsedDescriptor({
          pathname: '/somewhere'
        }, {
          pathname: '/somewhere',
          query: null,
          hash: '',
          state: null,
          search: ''
        })
      })

      it('uses state if provided', () => {
        assertParsedDescriptor({
          state: { status: 301 }
        }, {
          pathname: '',
          query: null,
          hash: '',
          state: { status: 301 },
          search: ''
        })
      })

      it('uses hash if provided', () => {
        assertParsedDescriptor({
          hash: '#hi'
        }, {
          pathname: '',
          query: null,
          hash: '#hi',
          state: null,
          search: ''
        })
      })

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
})

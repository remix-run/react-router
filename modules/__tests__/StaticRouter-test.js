import expect from 'expect'
import React from 'react'
import StaticRouter from '../StaticRouter'
import Link from '../Link'
import Redirect from '../Redirect'
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

    it('passes match props to function children', () => {
      let actualProps
      renderToString(
        <StaticRouter {...requiredProps} location="/lol">
          {(props) => <div>{(actualProps = props, null)}</div>}
        </StaticRouter>
      )
      expectDeepEquality(actualProps, {
        location: {
          action: 'POP',
          hash: '',
          key: null,
          pathname: '/lol',
          search: '',
          query: null,
          state: null
        }
      })
    })
  })

  describe('location prop', () => {
    it('parses string `location` into a real location', () => {
      let actualLocation
      renderToString(
        <StaticRouter {...requiredProps} location="/lol">
          {({ location }) => (
            <div>{(actualLocation = location, null)}</div>
          )}
        </StaticRouter>
      )
      const expected = {
        action: 'POP',
        hash: '',
        key: null,
        pathname: '/lol',
        search: '',
        query: {},
        state: null
      }
      expectDeepEquality(actualLocation, expected)
    })

    it('parses location with a `path` into a real location', () => {
      let actualLocation
      const loc = { path: '/somewhere?a=b#lol', state: { foo: 'bar' }}
      renderToString(
        <StaticRouter {...requiredProps} location={loc}>
          {({ location }) => <div>{(actualLocation = location, null)}</div>}
        </StaticRouter>
      )

      const expected = {
        action: 'POP',
        key: null,
        pathname: '/somewhere',
        search: '?a=b',
        hash: '#lol',
        query: { a: 'b' },
        state: { foo: 'bar' }
      }
      expectDeepEquality(actualLocation, expected)
    })
  })

  // TODO: maybe these tests just move to Link, Redirect, and NavigationPrompt,
  //       or like "integration-test.js"
  describe.skip('context', () => {
    describe('createHref', () => {
      it('creates hrefs', () => {
        const markup = renderToString(
          <StaticRouter location="/">
            <Link to="/somewhere"/>
          </StaticRouter>
        )
        expect(markup).toMatch(/\/somewhere/)
      })

      it('uses createHref prop', () => {
        const markup = renderToString(
          <StaticRouter location="/" createHref={(href) => '#'+href}>
            <Link to="/somewhere"/>
          </StaticRouter>
        )
        expect(markup).toMatch(/#\/somewhere/)
      })
    })

    describe('push', () => {
      it('calls onPush', (done) => {
        const assert = (location) => {
          expect(location).toExist()
          expect(location.pathname).toEqual('/somewhere')
          done()
        }
        renderToString(
          <StaticRouter location="/" onPush={assert}>
            {({ location }) => (
              location.pathname === "/" ? (
                <Redirect to="/somewhere" push/>
              ) : (
                <div>test</div>
              )
            )}
          </StaticRouter>
        )
      })
    })

    describe('replace', () => {

      it('calls onReplace', (done) => {
        const assert = (location) => {
          expect(location).toExist()
          expect(location.pathname).toEqual('/somewhere')
          done()
        }
        renderToString(
          <StaticRouter location="/" onPush={assert}>
            {({ location }) => (
              location.pathname === "/" ? (
                <Redirect to="/somewhere" push={false}/>
              ) : (
                <div>test</div>
              )
            )}
          </StaticRouter>
        )
      })
    })

    describe('block', () => {
      it('calls onBlock', (done) => {
        const assert = (location) => {
          expect(location).toExist()
          expect(location.pathname).toEqual('/somewhere')
          done()
        }
        renderToString(
          <StaticRouter location="/" onPush={assert}>
            {({ location }) => (
              location.pathname === "/" ? (
                <Redirect to="/somewhere" replace/>
              ) : (
                <div>test</div>
              )
            )}
          </StaticRouter>
        )
      })
    })
  })

})



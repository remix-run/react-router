import expect from 'expect'
import React from 'react'
import StaticRouter from '../StaticRouter'
import Link from '../Link'
import Redirect from '../Redirect'
import { renderToString } from 'react-dom/server'

console.error = () => {}

describe('StaticRouter', () => {

  describe('location prop', () => {
    it.only('parses string `location` into a real location', () => {
      let actualLocation
      renderToString(
        <StaticRouter location="/lol">
          {({ location }) => (
            <div>{(actualLocation = location, null)}</div>
          )}
        </StaticRouter>
      )
      expect(actualLocation).toEqual({
        action: 'POP',
        hash: '',
        key: null,
        pathname: '/lol',
        search: '',
        state: null
      })
    })

    it('parses location with a `path` into a real location', () => {
      let actualLocation
      renderToString(
        <StaticRouter location={{ path: '/somewhere?a=b#lol', state: { foo: 'bar' }}}>
          {({ location }) => <div>{(actualLocation = location, null)}</div>}
        </StaticRouter>
      )
      expect(actualLocation).toEqual({
        action: 'POP',
        key: null,
        pathname: '/somewhere',
        search: 'a=b',
        hash: 'lol',
        query: { a: 'b' },
        state: { foo: 'bar' }
      })
    })
  })

  // TODO: maybe these tests just move to Link, Redirect, and NavigationPrompt,
  //       or like "integration-test.js"
  describe('context', () => {
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

  describe('rendering', () => {
    it('renders static children', () => {
      expect(renderToString(
        <StaticRouter>
          <div>test</div>
        </StaticRouter>
      )).toContain('test')
    })

    it('passes match props to function children', () => {
      let actualProps
      renderToString(
        <StaticRouter location="/lol">
          {(props) => <div>{(actualProps = props, null)}</div>}
        </StaticRouter>
      )
      expect(actualProps).toEqual({
        location: {
          action: 'POP',
          hash: '',
          key: null,
          pathname: '/lol',
          search: '',
          state: undefined
        }
      })
    })
  })

})



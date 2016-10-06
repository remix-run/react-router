import expect from 'expect'
import React from 'react'
import Match from '../Match'
import { renderToString } from 'react-dom/server'
import { render } from 'react-dom'
import { LocationBroadcast } from '../locationBroadcast'

describe('Match', () => {
  const TEXT = 'TEXT'

  describe('with a `component` prop', () => {
    it('renders when the location matches', () => {
      const Page = () => <div>{TEXT}</div>
      const loc = { pathname: '/' }
      const html = renderToString(
        <Match
          pattern="/"
          location={loc}
          component={Page}
        />
      )
      expect(html).toContain(TEXT)
    })

    it('does not render when the location does not match', () => {
      const Page = () => <div>{TEXT}</div>
      const loc = { pathname: '/' }
      const html = renderToString(
        <Match
          pattern="/foo"
          location={loc}
          component={Page}
        />
      )
      expect(html).toNotContain(TEXT)
    })

    describe('props passed', () => {
      const run = (location, cb) => {
        const Page = (props) => <div>{(cb(props), null)}</div>
        renderToString(
          <Match
            pattern="/:foo/:bar"
            location={location}
            component={Page}
          />
        )
      }

      describe('when matched exactly', () => {
        it('passes props', () => {
          run({ pathname: '/one/two' }, (props) => {
            expect(props).toEqual({
              params: { foo: 'one', bar: 'two' },
              isExact: true,
              pathname: '/one/two',
              location: { pathname: '/one/two' },
              pattern: '/:foo/:bar'
            })
          })
        })
        it('decodes props', () => {
          run({ pathname: '/first%20name/second%20name' }, (props) => {
            expect(props).toEqual({
              params: { foo: 'first name', bar: 'second name' },
              isExact: true,
              pathname: '/first%20name/second%20name',
              location: { pathname: '/first%20name/second%20name' },
              pattern: '/:foo/:bar'
            })
          })
        })
      })

      describe('when matched partially', () => {
        it('passes props with partially matched information', () => {
          run({ pathname: '/one/two/three/four' }, (props) => {
            // this allows for recursive/relative matching
            expect(props.pathname).toEqual('/one/two') // only what's matched
            expect(props.isExact).toEqual(false)
          })
        })
      })
    })

    describe('when deep matches', () => {

      const Page = () => <div>{TEXT}</div>

      const SubSubMatch = ({ location }) => (
        <Match
          pattern="open"
          location={location}
          component={Page}
        />
      )

      const SubMatch = ({ location }) => (
        <Match
          pattern="page"
          location={location}
          component={SubSubMatch}
        />
      )

      const renderMatch = ({ location, div }) => render(
        <Match
          pattern="/"
          location={location}
          component={SubMatch}
        />,
        div
      )

      it('renders deep match', () => {
        const div = document.createElement('div')

        const page = { pathname: '/page/open' }
        renderMatch({ location: page, div })
        expect(div.textContent).toContain(TEXT)
      })

      it('should render deep match on path change', () => {
        const div = document.createElement('div')

        const initial = { pathname: '/' }
        renderMatch({ location: initial, div })
        expect(div.textContent).toNotContain(TEXT)

        const page = { pathname: '/page/open' }
        renderMatch({ location: page, div })
        expect(div.textContent).toContain(TEXT)
      })
    })
  })

  describe('with a `render` prop', () => {
    it('renders when the location matches', () => {
      const loc = { pathname: '/' }
      const html = renderToString(
        <Match
          pattern="/"
          location={loc}
          render={() => <div>{TEXT}</div>}
        />
      )
      expect(html).toContain(TEXT)
    })

    it('does not render when the location does not match', () => {
      const loc = { pathname: '/' }
      const html = renderToString(
        <Match
          pattern="/foo"
          location={loc}
          render={() => <div>{TEXT}</div>}
        />
      )
      expect(html).toNotContain(TEXT)
    })

    describe('props passed', () => {
      const run = (location, cb) => {
        renderToString(
          <Match
            pattern="/:foo/:bar"
            location={location}
            render={(props) => (
              <div>{(cb(props), null)}</div>
            )}
          />
        )
      }

      describe('when matched exactly', () => {
        it('passes props', () => {
          run({ pathname: '/one/two' }, (props) => {
            expect(props).toEqual({
              params: { foo: 'one', bar: 'two' },
              isExact: true,
              pathname: '/one/two',
              location: { pathname: '/one/two' },
              pattern: '/:foo/:bar'
            })
          })
        })
      })
    })
  })

  describe('with a `children` prop', () => {
    it('renders when the location matches', () => {
      const loc = { pathname: '/' }
      const html = renderToString(
        <Match
          pattern="/"
          location={loc}
          children={() => <div>{TEXT}</div>}
        />
      )
      expect(html).toContain(TEXT)
    })

    it('it renders when the location does not match', () => {
      const loc = { pathname: '/' }
      const html = renderToString(
        <Match
          pattern="/foo"
          location={loc}
          children={() => <div>{TEXT}</div>}
        />
      )
      expect(html).toContain(TEXT)
    })

    describe('props passed', () => {
      const run = (location, cb) => {
        renderToString(
          <Match
            pattern="/:foo/:bar"
            location={location}
            children={(props) => (
              <div>{(cb(props), null)}</div>
            )}
          />
        )
      }

      it('passes props when matched', () => {
        run({ pathname: '/one/two' }, (props) => {
          expect(props).toEqual({
            matched: true,
            params: { foo: 'one', bar: 'two' },
            isExact: true,
            pathname: '/one/two',
            location: { pathname: '/one/two' },
            pattern: '/:foo/:bar'
          })
        })
      })

      it('passes props when not matched', () => {
        run({ pathname: '/' }, (props) => {
          expect(props).toEqual({
            matched: false,
            location: { pathname: '/' },
            pattern: '/:foo/:bar'
          })
        })
      })
    })
  })

  describe('`exactly` prop', () => {
    const TEXT = 'TEXT'
    const run = (location, cb) => (
      cb(renderToString(
        <Match
          exactly
          pattern="/foo"
          location={location}
          render={() => (
            <div>{TEXT}</div>
          )}
        />
      ))
    )

    describe('when matched exactly', () => {
      it('renders', () => {
        run({ pathname: '/foo' }, (html) => {
          expect(html).toContain(TEXT)
        })
      })
    })

    describe('when matched partially', () => {
      it('does not render', () => {
        run({ pathname: '/foo/bar' }, (html) => {
          expect(html).toNotContain(TEXT)
        })
      })
    })
  })

  describe('when rendered in context of a location', () => {
    it('matches the location from context', () => {
      const TEXT = 'TEXT'
      const location = { pathname: '/', state: { test: TEXT } }
      const html = renderToString(
        <LocationBroadcast value={location}>
          <Match pattern="/" render={({ location }) => (
            <div>{location.state.test}</div>
          )}/>
        </LocationBroadcast>
      )
      expect(html).toContain(TEXT)
    })

    describe('when giving a location prop', () => {
      it('matches the location from props', () => {
        const CONTEXT = 'CONTEXT'
        const PROP = 'PROP'
        const contextLoc = { pathname: '/', state: { test: CONTEXT } }
        const propsLoc = { pathname: '/', state: { test: PROP } }
        const html = renderToString(
          <LocationBroadcast value={contextLoc}>
            <Match location={propsLoc} pattern="/" render={({ location }) => (
              <div>{location.state.test}</div>
            )}/>
          </LocationBroadcast>
        )
        expect(html).toNotContain(CONTEXT)
        expect(html).toContain(PROP)
      })
    })
  })

})

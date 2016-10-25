import expect from 'expect'
import React from 'react'
import Match from '../Match'
import Router from '../MemoryRouter'
import { renderToString } from 'react-dom/server'
import { render } from 'react-dom'
//import { LocationBroadcast } from '../Broadcasts'

describe('Match', () => {
  const TEXT = 'TEXT'

  describe('with a `component` prop', () => {
    it('renders when the location matches', () => {
      const Page = () => <div>{TEXT}</div>
      const loc = { pathname: '/' }
      const html = renderToString(
        <Router intialEntries={[ loc ]}>
          <Match
            pattern="/"
            component={Page}
          />
        </Router>
      )
      expect(html).toContain(TEXT)
    })

    it('does not render when the location does not match', () => {
      const Page = () => <div>{TEXT}</div>
      const loc = { pathname: '/' }
      const html = renderToString(
        <Router intialEntries={[ loc ]}>
          <Match pattern="/foo" component={Page} />
        </Router>
      )
      expect(html).toNotContain(TEXT)
    })

    describe('props passed', () => {
      const run = (location, cb) => {
        const Page = (props) => <div>{(cb(props), null)}</div>
        renderToString(
          <Router intialEntries={[ location ]}>
            <Match
              pattern="/:foo/:bar"
              component={Page}
            />
          </Router>
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

      const SubSubMatch = () => (
        <Match pattern="open" component={Page} />
      )

      const SubMatch = () => (
        <Match pattern="page" component={SubSubMatch} />
      )

      const renderMatch = ({ location, div }) => render(
        <Router initialEntries={[ location ]}>
          <Match pattern="/" component={SubMatch} />
        </Router>,
        div
      )

      it('renders deep match', () => {
        const div = document.createElement('div')

        const page = { pathname: '/page/open' }
        renderMatch({ location: page, div })
        expect(div.textContent).toContain(TEXT)
      })

      // TODO: need to do execNextSteps type stuff here
      it.skip('renders deep match on path change', () => {
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
        <Router initialEntries={[ loc ]}>
          <Match pattern="/" render={() => <div>{TEXT}</div>} />
        </Router>
      )
      expect(html).toContain(TEXT)
    })

    it('does not render when the location does not match', () => {
      const loc = { pathname: '/' }
      const html = renderToString(
        <Router initialEntries={[ loc ]}>
          <Match
            pattern="/foo"
            render={() => <div>{TEXT}</div>}
          />
        </Router>
      )
      expect(html).toNotContain(TEXT)
    })

    describe('props passed', () => {
      const run = (location, cb) => {
        renderToString(
          <Router initialEntries={[ location ]}>
            <Match
              pattern="/:foo/:bar"
              render={(props) => (
                <div>{(cb(props), null)}</div>
              )}
            />
          </Router>
        )
      }

      describe('when matched exactly', () => {
        it('passes props', () => {
          run({ pathname: '/one/two' }, (props) => {
            expect(props).toEqual({
              isExact: true,
              location: {
                hash: '',
                pathname: '/one/two',
                query: null,
                search: '',
                state: null
              },
              params: { foo: 'one', bar: 'two' },
              pathname: '/one/two',
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
        <Router initialEntries={[ loc ]}>
          <Match
            pattern="/"
            children={() => <div>{TEXT}</div>}
          />
        </Router>
      )
      expect(html).toContain(TEXT)
    })

    it('it renders when the location does not match', () => {
      const loc = { pathname: '/' }
      const html = renderToString(
        <Router initialEntries={[ loc ]}>
          <Match
            pattern="/foo"
            children={() => <div>{TEXT}</div>}
          />
        </Router>
      )
      expect(html).toContain(TEXT)
    })

    describe('props passed', () => {
      const run = (location, cb) => {
        renderToString(
          <Router initialEntries={[ location ]}>
            <Match
              pattern="/:foo/:bar"
              children={(props) => (
                <div>{(cb(props), null)}</div>
              )}
            />
          </Router>
        )
      }

      it('passes props when matched', () => {
        run({ pathname: '/one/two' }, (props) => {
          expect(props).toEqual({
            matched: true,
            params: { foo: 'one', bar: 'two' },
            isExact: true,
            pathname: '/one/two',
            location: {
              hash: '',
              pathname: '/one/two',
              query: null,
              search: '',
              state: null
            },
            pattern: '/:foo/:bar'
          })
        })
      })

      it('passes props when not matched', () => {
        run({ pathname: '/' }, (props) => {
          expect(props).toEqual({
            matched: false,
            location: {
              hash: '',
              pathname: '/',
              query: null,
              search: '',
              state: null
            },
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
        <Router initialEntries={[ location ]}>
          <Match
            exactly
            pattern="/foo"
            render={() => (
              <div>{TEXT}</div>
            )}
          />
        </Router>
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

  describe('with a trailing slash', () => {
    const TEXT = 'TEXT'
    const run = (location, cb) => (
      cb(renderToString(
        <Router initialEntries={[ location ]}>
          <Match
            pattern="/foo/"
            render={() => (
              <div>{TEXT}</div>
            )}
          />
        </Router>
      ))
    )

    describe('when matched exactly', () => {
      it('renders', () => {
        run({ pathname: '/foo/' }, (html) => {
          expect(html).toContain(TEXT)
        })
      })
    })

    describe('when matched partially', () => {
      it('renders', () => {
        run({ pathname: '/foo/bar/' }, (html) => {
          expect(html).toContain(TEXT)
        })
      })
    })

    describe('when the trailing slash is missing', () => {
      it('does not renders', () => {
        run({ pathname: '/foo' }, (html) => {
          expect(html).toNotContain(TEXT)
        })
      })
    })
  })

  describe('`exactly` prop with a trailing slash', () => {
    const TEXT = 'TEXT'
    const run = (location, cb) => (
      cb(renderToString(
        <Router initialEntries={[ location ]}>
          <Match
            exactly
            pattern="/foo/"
            render={() => (
              <div>{TEXT}</div>
            )}
          />
        </Router>
      ))
    )

    describe('when matched exactly', () => {
      it('renders', () => {
        run({ pathname: '/foo/' }, (html) => {
          expect(html).toContain(TEXT)
        })
      })
    })

    describe('when matched partially', () => {
      it('does not render', () => {
        run({ pathname: '/foo/bar/' }, (html) => {
          expect(html).toNotContain(TEXT)
        })
      })
    })

    describe('when the trailing slash is missing', () => {
      it('does not renders', () => {
        run({ pathname: '/foo' }, (html) => {
          expect(html).toNotContain(TEXT)
        })
      })
    })
  })

})

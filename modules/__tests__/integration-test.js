import expect from 'expect'
import React from 'react'
import MemoryRouter from '../MemoryRouter'
import NavigationPrompt from '../NavigationPrompt'
import Redirect from '../Redirect'
import StaticRouter from '../StaticRouter'
import Match from '../Match'
import Miss from '../Miss'
import { Simulate } from 'react-addons-test-utils'
import Link from '../Link'
import { render } from 'react-dom'

const requiredPropsForStaticRouter = {
  location: '/',
  action: 'POP',
  createHref: () => {},
  blockTransitions: () => {}, // we sure we want this required? servers don't need it.
  onPush: () => {},
  onReplace: () => {}
}

describe('Integration Tests', () => {

  it('renders root match', () => {
    const div = document.createElement('div')
    const TEXT = 'Mrs. Kato'
    render((
      <MemoryRouter location="/">
        <Match pattern="/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toContain(TEXT)
  })

  it('renders nested matches', () => {
    const div = document.createElement('div')
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    render((
      <MemoryRouter location="/nested">
        <Match pattern="/" render={() => (
          <div>
            <h1>{TEXT1}</h1>
            <Match pattern="/nested" render={() => (
              <h2>{TEXT2}</h2>
            )}/>
          </div>
        )}/>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toContain(TEXT2)
  })

  it('renders only as deep as the match', () => {
    const div = document.createElement('div')
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    render((
      <MemoryRouter location="/">
        <Match pattern="/" render={() => (
          <div>
            <h1>{TEXT1}</h1>
            <Match pattern="/nested" render={() => (
              <h2>{TEXT2}</h2>
            )}/>
          </div>
        )}/>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toNotContain(TEXT2)
  })

  it('renders multiple matches', () => {
    const div = document.createElement('div')
    const TEXT1 = 'Mrs. Schiffman'
    const TEXT2 = 'Mrs. Burton'
    render((
      <MemoryRouter location="/double">
        <div>
          <aside>
            <Match pattern="/double" render={() => (
              <h1>{TEXT1}</h1>
            )}/>
          </aside>
          <main>
            <Match pattern="/double" render={() => (
              <h1>{TEXT2}</h1>
            )}/>
          </main>
        </div>
      </MemoryRouter>
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toContain(TEXT2)
  })

  describe('nested Match', () => {
    it('renders a nested relative pattern', () => {
      const div = document.createElement('div')
      const Page = () => <div>Page</div>
      render((
        <MemoryRouter location="/test/nested/paths">
          <Match pattern="/test/nested" render={() => <Match pattern="paths" component={Page} />} />
        </MemoryRouter>
      ), div)
      expect(div.innerHTML).toContain('Page')
    })

    it('renders a nested relative pattern from the root', () => {
      const div = document.createElement('div')
      const Page = () => <div>Page</div>
      render((
        <MemoryRouter location="/test">
          <Match pattern="/" render={() => <Match pattern="test" component={Page} />} />
        </MemoryRouter>
      ), div)
      expect(div.innerHTML).toContain('Page')
    })

    it('renders a nested absolute pattern like normal', () => {
      const div = document.createElement('div')
      const Page = () => <div>Page</div>
      render((
        <MemoryRouter location="/test/nested/paths">
          <Match pattern="/" render={() => <Match pattern="/test/nested" component={Page} />} />
        </MemoryRouter>
      ), div)
      expect(div.innerHTML).toContain('Page')
    })
  })

  describe('Ambiguous matches?', () => {
    it('should render both the dynamic and static patterns', () => {
      const div = document.createElement('div')
      render(
        <MemoryRouter location="/foo">
          <div>
            <Match pattern="/foo" render={() => <div>static</div>}/>
            <Match pattern="/:name" render={() => <div>param</div>}/>
          </div>
        </MemoryRouter>,
        div)
      expect(div.innerHTML).toContain('static')
      expect(div.innerHTML).toContain('param')
    })

    describe('with nested Match/Miss', () => {
      const leftClickEvent = {
        defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true },
        metaKey: null,
        altKey: null,
        ctrlKey: null,
        shiftKey: null,
        button: 0
      }

      it('allows devs to match the dynamic pattern only', () => {
        const div = document.createElement('div')
        const pathname = '/non-static-param'
        render((
          <MemoryRouter location={pathname}>
            <div>
              <Match pattern="/:name" render={({ params }) => (
                <div>
                  <Match pattern="/foo" render={() => <div>foo</div>}/>
                  <Miss render={() => <div>{params.name}</div>}/>
                </div>
              )}/>
            </div>
          </MemoryRouter>
        ), div)
        expect(div.innerHTML).toNotContain('foo')
        expect(div.innerHTML).toContain('non-static-param')
      })

      it('should match the dynamic pattern on return visits when Miss is still mounted', () => {
        const div = document.createElement('div')
        render((
          <MemoryRouter>
            <div>
              <Link id="root" to="/">Root</Link>
              <Link id="foo" to="/foo">Foo</Link>
              <Link id="dynamic" to="/dynamic">Dynamic</Link>
              <Match pattern="/" exactly render={() => <div>root component</div>}/>
              <Match pattern="/:name" render={({ params }) => (
                <div>
                  <Match pattern="/foo" render={() => <div>foo component</div>}/>
                  <Miss render={() => <div>{`${params.name} component`}</div>}/>
                </div>
              )}/>
            </div>
          </MemoryRouter>
        ), div)
        expect(div.innerHTML).toNotContain('foo component')
        expect(div.innerHTML).toNotContain('dynamic component')
        expect(div.innerHTML).toContain('root component')

        Simulate.click(div.querySelector('#dynamic'), leftClickEvent)
        expect(div.innerHTML).toNotContain('foo component')
        expect(div.innerHTML).toNotContain('root component')
        expect(div.innerHTML).toContain('dynamic component')

        Simulate.click(div.querySelector('#root'), leftClickEvent)
        expect(div.innerHTML).toNotContain('foo component')
        expect(div.innerHTML).toNotContain('dynamic component')
        expect(div.innerHTML).toContain('root component')

        Simulate.click(div.querySelector('#dynamic'), leftClickEvent)
        expect(div.innerHTML).toNotContain('foo component')
        expect(div.innerHTML).toNotContain('root component')
        expect(div.innerHTML).toContain('dynamic component')
      })

      it('allows devs to match the static pattern only', () => {
        const div = document.createElement('div')
        const pathname = '/foo'
        render((
          <MemoryRouter location={pathname}>
            <div>
              <Match pattern="/foo" render={() => <div>match</div>}/>
              <Miss render={() => <div>miss</div>}/>
            </div>
          </MemoryRouter>
        ), div)
        expect(div.innerHTML).toContain('match')
        expect(div.innerHTML).toNotContain('miss')
      })
    })
  })

  describe('clicking around', () => {
    const leftClickEvent = {
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true },
      metaKey: null,
      altKey: null,
      ctrlKey: null,
      shiftKey: null,
      button: 0
    }

    it('navigates', () => {
      const div = document.createElement('div')
      const TEXT1 = 'I AM PAGE 1'
      render((
        <MemoryRouter>
          <div>
            <Link id="one" to="/one">One</Link>
            <Match pattern="/one" render={() => (
              <h1>{TEXT1}</h1>
            )}/>
          </div>
        </MemoryRouter>
      ), div)
      expect(div.innerHTML).toNotContain(TEXT1)

      Simulate.click(div.querySelector('#one'), leftClickEvent)
      expect(div.innerHTML).toContain(TEXT1)
    })

    it('pushes a new URL', () => {
      const div = document.createElement('div')
      const pushes = []
      const replaces = []
      const TARGET = '/TARGET'
      render((
        <StaticRouter
          {...requiredPropsForStaticRouter}
          onPush={(loc) => { pushes.push(loc) }}
          onReplace={(loc) => { replaces.push(loc) }}
        >
          <Link id="target" to={TARGET}>{TARGET}</Link>
        </StaticRouter>
      ), div)
      Simulate.click(div.querySelector('#target'), leftClickEvent)
      expect(pushes.length).toEqual(1)
      expect(pushes[0].pathname).toEqual(TARGET)
      expect(replaces.length).toEqual(0)
    })

    it('replaces the current URL with replace', () => {
      const div = document.createElement('div')
      const pushes = []
      const replaces = []
      const TARGET = '/TARGET'
      render((
        <StaticRouter
          {...requiredPropsForStaticRouter}
          onPush={(loc) => { pushes.push(loc) }}
          onReplace={(loc) => { replaces.push(loc) }}
        >
          <Link id="target" to={TARGET} replace>{TARGET}</Link>
        </StaticRouter>
      ), div)
      Simulate.click(div.querySelector('#target'), leftClickEvent)
      expect(pushes.length).toEqual(0)
      expect(replaces.length).toEqual(1)
      expect(replaces[0].pathname).toEqual(TARGET)
    })
  })

  describe('Link location descriptors', () => {
    it('allows for location descriptors', () => {
      const loc = {
        pathname: '/test-url',
        state: { isTest: true },
        query: { foo: 'bar' },
        hash: '#anchor'
      }
      const div = document.createElement('div')
      render((
        <MemoryRouter>
          <Link to={loc}>link</Link>
        </MemoryRouter>
      ), div)
      const href = div.querySelector('a').getAttribute('href')
      expect(href).toEqual('/test-url?foo=bar#anchor')
    })

    it('uses search', () => {
      const loc = {
        pathname: '/test-url',
        search: '?foo=baz'
      }
      const div = document.createElement('div')
      render((
        <MemoryRouter>
          <Link to={loc}>link</Link>
        </MemoryRouter>
      ), div)
      const href = div.querySelector('a').getAttribute('href')
      expect(href).toEqual('/test-url?foo=baz')
    })

  })

  describe('Link with a query', () => {
    it('is active when all the query matches', () => {
      const div = document.createElement('div')
      const loc = { pathname: '/foo', query: { a: 'b' } }
      render((
        <MemoryRouter initialEntries={[ loc ]}>
          <Link
            to={loc}
            activeClassName="active"
          />
        </MemoryRouter>
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toEqual('active')
    })

    it('is not active when the query does not match', () => {
      const div = document.createElement('div')
      render((
        <MemoryRouter initialEntries={[{ pathname: '/foo', query: { a: 'c' } }]}>
          <Link
            to={{ pathname: '/foo', query: { a: 'b' } }}
            activeClassName="active"
          />
        </MemoryRouter>
      ), div)
      const a = div.querySelector('a')
      expect(a.className).toNotEqual('active')
    })
  })

  describe('Match and Miss Integration', () => {

    describe('Miss', () => {
      it('renders when nothing else matches', () => {
        const div = document.createElement('div')
        const FOO = '/FOO'
        const MISS = '/MISS'
        render((
          <StaticRouter
            {...requiredPropsForStaticRouter}
            location={{ pathname: MISS }}
          >
            <div>
              <Match pattern={FOO} render={() => <div>{FOO}</div>}/>
              <Miss render={() => <div>{MISS}</div>}/>
            </div>
          </StaticRouter>
        ), div)
        expect(div.innerHTML).toNotContain(FOO)
        expect(div.innerHTML).toContain(MISS)
      })

      it('does not render when something matches', () => {
        const div = document.createElement('div')
        const FOO = '/FOO'
        const MISS = '/MISS'
        render((
          <StaticRouter
            {...requiredPropsForStaticRouter}
            location={{ pathname: FOO }}
          >
            <div>
              <Match pattern={FOO} render={() => <div>{FOO}</div>}/>
              <Miss render={() => <div>{MISS}</div>}/>
            </div>
          </StaticRouter>
        ), div)
        expect(div.innerHTML).toContain(FOO)
        expect(div.innerHTML).toNotContain(MISS)
      })
    })
  })

  describe('NavigationPrompt', () => {
    const TEXT = 'TEXT'
    const leftClickEvent = {
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true },
      metaKey: null,
      altKey: null,
      ctrlKey: null,
      shiftKey: null,
      button: 0
    }

    // TODO: make this test pass when react-history supports getUserConfirmation
    it.skip('Prompts the user to allow a transition', () => {
      const div = document.createElement('div')
      let message
      render((
        <MemoryRouter
          getUserConfirmation={(_message) => message = _message}
        >
          <div>
            <Link to="/somewhere-else" id="link"/>
            <NavigationPrompt message={TEXT}/>
          </div>
        </MemoryRouter>
      ), div)
      Simulate.click(div.querySelector('a'), leftClickEvent)
      expect(message).toEqual(TEXT)
    })
  })

  describe('Redirect', () => {
    it('replaces the current URL', () => {
      const div = document.createElement('div')
      const pushes = []
      const replaces = []
      const REDIRECTED = '/REDIRECTED'
      render((
        <StaticRouter
          {...requiredPropsForStaticRouter}
          onPush={(loc) => { pushes.push(loc) }}
          onReplace={(loc) => { replaces.push(loc) }}
        >
          <Redirect to={REDIRECTED} />
        </StaticRouter>
      ), div)
      expect(pushes.length).toEqual(0)
      expect(replaces.length).toEqual(1)
      expect(replaces[0].pathname).toEqual(REDIRECTED)
    })

    it('pushes a new URL with push', () => {
      const div = document.createElement('div')
      const pushes = []
      const replaces = []
      const REDIRECTED = '/REDIRECTED'
      render((
        <StaticRouter
          {...requiredPropsForStaticRouter}
          onPush={(loc) => { pushes.push(loc) }}
          onReplace={(loc) => { replaces.push(loc) }}
        >
          <Redirect to={REDIRECTED} push />
        </StaticRouter>
      ), div)
      expect(pushes.length).toEqual(1)
      expect(pushes[0].pathname).toEqual(REDIRECTED)
      expect(replaces.length).toEqual(0)
    })
  })
})

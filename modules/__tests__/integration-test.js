import expect from 'expect'
import React from 'react'
import Router from '../MemoryRouter'
import NavigationPrompt from '../NavigationPrompt'
import StaticRouter from '../StaticRouter'
import Match from '../Match'
import Miss from '../Miss'
import { Simulate } from 'react-addons-test-utils'
import Link from '../Link'
import { render } from 'react-dom'

describe('Integration Tests', () => {

  it('renders root match', () => {
    const div = document.createElement('div')
    const TEXT = 'Mrs. Kato'
    render((
      <Router location="/">
        <Match pattern="/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </Router>
    ), div)
    expect(div.innerHTML).toContain(TEXT)
  })

  it('renders nested matches', () => {
    const div = document.createElement('div')
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    render((
      <Router location="/nested">
        <Match pattern="/" render={() => (
          <div>
            <h1>{TEXT1}</h1>
            <Match pattern="/nested" render={() => (
              <h2>{TEXT2}</h2>
            )}/>
          </div>
        )}/>
      </Router>
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toContain(TEXT2)
  })

  it('renders only as deep as the match', () => {
    const div = document.createElement('div')
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    render((
      <Router location="/">
        <Match pattern="/" render={() => (
          <div>
            <h1>{TEXT1}</h1>
            <Match pattern="/nested" render={() => (
              <h2>{TEXT2}</h2>
            )}/>
          </div>
        )}/>
      </Router>
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toNotContain(TEXT2)
  })

  it('renders multiple matches', () => {
    const div = document.createElement('div')
    const TEXT1 = 'Mrs. Schiffman'
    const TEXT2 = 'Mrs. Burton'
    render((
      <Router location="/double">
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
      </Router>
    ), div)
    expect(div.innerHTML).toContain(TEXT1)
    expect(div.innerHTML).toContain(TEXT2)
  })

})

describe('nested Match', () => {
  it('renders a nested relative pattern', () => {
    const div = document.createElement('div')
    const Page = () => <div>Page</div>
    render((
      <Router location="/test/nested/paths">
        <Match pattern="/test/nested" render={() => <Match pattern="paths" component={Page} />} />
      </Router>
    ), div)
    expect(div.innerHTML).toContain('Page')
  })

  it('renders a nested relative pattern from the root', () => {
    const div = document.createElement('div')
    const Page = () => <div>Page</div>
    render((
      <Router location="/test">
        <Match pattern="/" render={() => <Match pattern="test" component={Page} />} />
      </Router>
    ), div)
    expect(div.innerHTML).toContain('Page')
  })

  it('renders a nested absolute pattern like normal', () => {
    const div = document.createElement('div')
    const Page = () => <div>Page</div>
    render((
      <Router location="/test/nested/paths">
        <Match pattern="/" render={() => <Match pattern="/test/nested" component={Page} />} />
      </Router>
    ), div)
    expect(div.innerHTML).toContain('Page')
  })
})

describe('Ambiguous matches?', () => {
  it('should render both the dynamic and static patterns', () => {
    const div = document.createElement('div')
    render(
      <Router location="/foo">
        <Match pattern="/foo" render={() => <div>static</div>}/>
        <Match pattern="/:name" render={() => <div>param</div>}/>
      </Router>,
      div)
    expect(div.innerHTML).toContain('static')
    expect(div.innerHTML).toContain('param')
  })

  describe('with nested Match/Miss', () => {
    it('allows devs to match the dynamic pattern only', () => {
      const div = document.createElement('div')
      const pathname = '/non-static-param'
      render((
        <Router location={pathname}>
          <Match pattern="/:name" render={({ params }) => (
            <div>
              <Match pattern="/foo" render={() => <div>foo</div>}/>
              <Miss render={() => <div>{params.name}</div>}/>
            </div>
          )}/>
        </Router>
      ), div)
      expect(div.innerHTML).toNotContain('foo')
      expect(div.innerHTML).toContain('non-static-param')
    })

    it('allows devs to match the static pattern only', () => {
      const div = document.createElement('div')
      const pathname = '/foo'
      render((
        <Router location={pathname}>
          <Match pattern="/foo" render={() => <div>match</div>}/>
          <Miss render={() => <div>miss</div>}/>
        </Router>
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
      <Router>
        <div>
          <Link id="one" to="/one">One</Link>
        </div>
        <Match pattern="/one" render={() => (
          <h1>{TEXT1}</h1>
        )}/>
      </Router>
    ), div)
    expect(div.innerHTML).toNotContain(TEXT1)

    Simulate.click(div.querySelector('#one'), leftClickEvent)
    expect(div.innerHTML).toContain(TEXT1)
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
      <Router>
        <Link to={loc}>link</Link>
      </Router>
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
      <Router>
        <Link to={loc}>link</Link>
      </Router>
    ), div)
    const href = div.querySelector('a').getAttribute('href')
    expect(href).toEqual('/test-url?foo=baz')
  })

  it('ignores search if query is present', () => {
    const loc = {
      pathname: '/test-url',
      query: { foo: 'bar' },
      search: '?foo=baz'
    }
    const div = document.createElement('div')
    render((
      <Router>
        <Link to={loc}>link</Link>
      </Router>
    ), div)
    const href = div.querySelector('a').getAttribute('href')
    expect(href).toEqual('/test-url?foo=bar')
  })
})

describe('Link with a query', () => {
  it('is active when all the query matches', () => {
    const div = document.createElement('div')
    const loc = { pathname: '/foo', query: { a: 'b' } }
    render((
      <Link
        to={loc}
        location={loc}
        activeClassName="active"
      />
    ), div)
    const a = div.querySelector('a')
    expect(a.className).toEqual('active')
  })

  it('is not active when the query does not match', () => {
    const div = document.createElement('div')
    render((
      <Link
        to={{ pathname: '/foo', query: { a: 'b' } }}
        location={{ pathname: '/foo', query: { a: 'c' } }}
        activeClassName="active"
      />
    ), div)
    const a = div.querySelector('a')
    expect(a.className).toNotEqual('active')
  })
})

describe('Match and Miss Integration', () => {

  const requiredProps = {
    location: '/',
    action: 'POP',
    createHref: () => {},
    blockTransitions: () => {}, // we sure we want this required? servers don't need it.
    onPush: () => {},
    onReplace: () => {}
  }

  describe('Miss', () => {
    it('renders when nothing else matches', () => {
      const div = document.createElement('div')
      const FOO = '/FOO'
      const MISS = '/MISS'
      render((
        <StaticRouter
          {...requiredProps}
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
          {...requiredProps}
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
      <Router
        getUserConfirmation={(_message) => message = _message}
      >
        <div>
          <Link to="/somewhere-else" id="link"/>
          <NavigationPrompt message={TEXT}/>
        </div>
      </Router>
    ), div)
    Simulate.click(div.querySelector('a'), leftClickEvent)
    expect(message).toEqual(TEXT)
  })
})

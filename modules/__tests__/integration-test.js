import expect from 'expect'
import React from 'react'
import Router from '../MemoryRouter'
import Match from '../Match'
import Miss from '../Miss'
import { Simulate } from 'react-addons-test-utils'
import Link from '../Link'
import { renderToString } from 'react-dom/server'
import { render } from 'react-dom'

describe('Integration Tests', () => {

  it('renders root match', () => {
    const TEXT = 'Mrs. Kato'
    const markup = renderToString(
      <Router location="/">
        <Match pattern="/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </Router>
    )
    expect(markup).toContain(TEXT)
  })

  it('renders nested matches', () => {
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    const markup = renderToString(
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
    )
    expect(markup).toContain(TEXT1)
    expect(markup).toContain(TEXT2)
  })

  it('renders only as deep as the match', () => {
    const TEXT1 = 'Ms. Tripp'
    const TEXT2 = 'Mrs. Schiffman'
    const markup = renderToString(
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
    )
    expect(markup).toContain(TEXT1)
    expect(markup).toNotContain(TEXT2)
  })

  it('renders multiple matches', () => {
    const TEXT1 = 'Mrs. Schiffman'
    const TEXT2 = 'Mrs. Burton'
    const markup = renderToString(
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
    )
    expect(markup).toContain(TEXT1)
    expect(markup).toContain(TEXT2)
  })

})

describe('Ambiguous matches?', () => {
  it('should render both the dynamic and static patterns', () => {
    const html = renderToString(
      <Router location="/foo">
        <Match pattern="/foo" render={() => <div>static</div>}/>
        <Match pattern="/:name" render={() => <div>param</div>}/>
      </Router>
    )
    expect(html).toContain('static')
    expect(html).toContain('param')
  })

  describe('with nested Match/Miss', () => {
    it('allows devs to match the dynamic pattern only', () => {
      const pathname = '/non-static-param'
      const html = renderToString(
        <Router location={pathname}>
          <Match pattern="/:name" render={({ params }) => (
            <div>
              <Match pattern="/foo" render={() => <div>foo</div>}/>
              <Miss render={() => <div>{params.name}</div>}/>
            </div>
          )}/>
        </Router>
      )
      expect(html).toNotContain('foo')
      expect(html).toContain('non-static-param')
    })

    it('allows devs to match the static pattern only', () => {
      const pathname = '/foo'
      const html = renderToString((
        <Router location={pathname}>
          <Match pattern="/foo" render={() => <div>match</div>}/>
          <Miss render={() => <div>miss</div>}/>
        </Router>
      ))
      expect(html).toContain('match')
      expect(html).toNotContain('miss')
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




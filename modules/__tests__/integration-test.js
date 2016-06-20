import expect from 'expect'
import React from 'react'
import Router from '../Router'
import Match from '../Match'
import Miss from '../Miss'
import { renderToString } from 'react-dom/server'
import { render } from 'react-dom'
import createMemoryHistory from 'history/lib/createMemoryHistory'

const renderToStringWithDOM = (el) => {
  const div = document.createElement('div')
  render(el, div)
  return div.innerHTML
}

// definitely want this behavior
describe('multiple matched Match', () => {
  it('renders all matched Match components', () => {
    const html = renderToString(
      <Router history={createMemoryHistory([ '/foo' ])}>
        <aside>
          <Match pattern="/foo" render={() => <div>sidebar</div>}/>
        </aside>
        <main>
          <Match pattern="/foo" render={() => <div>main</div>}/>
        </main>
      </Router>
    )
    expect(html).toContain('sidebar')
    expect(html).toContain('main')
  })
})


// not sure what to do here...
describe('Ambiguous matches?', () => {

  it('should render both the dynamic and static patterns', () => {
    const html = renderToString(
      <Router history={createMemoryHistory([ '/foo' ])}>
        <Match pattern="/foo" render={() => <div>static</div>}/>
        <Match pattern="/:name" render={() => <div>param</div>}/>
      </Router>
    )
    expect(html).toContain('static')
    expect(html).toContain('param')
  })

  describe('with nested Match/Miss', () => {
    it('allows users to match the dynamic pattern only', () => {
      const pathname = '/non-static-param'
      const html = renderToStringWithDOM(
        <Router history={createMemoryHistory([ pathname ])}>
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

    it('allows users to match the static pattern only', () => {
      const pathname = '/foo'
      // this fails with `renderToString`, I think the
      // reconciler has a bug w/ context causing setState
      // calls on the same tick, haven't looked too deep
      const html = renderToStringWithDOM((
        <Router history={createMemoryHistory([ pathname ])}>
          <Match pattern="/foo" render={() => <div>match</div>}/>
          <Miss render={() => <div>miss</div>}/>
        </Router>
      ))
      expect(html).toContain('match')
      expect(html).toNotContain('miss')
    })
  })
})


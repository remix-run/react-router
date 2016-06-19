import expect from 'expect'
import React from 'react'
import Router from '../Router'
import Match from '../Match'
import Miss from '../Miss'
import matchPattern from '../matchPattern'
import { renderToString } from 'react-dom/server'
import createMemoryHistory from 'history/lib/createMemoryHistory'

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

  it('should render both?', () => {
    const html = renderToString(
      <Router history={createMemoryHistory([ '/foo' ])}>
        <Match pattern="/foo" render={() => <div>static</div>}/>
        <Match pattern="/:name" render={() => <div>param</div>}/>
      </Router>
    )
    expect(html).toContain('static')
    expect(html).toContain('param')
  })

  it('lets the user decide what to do?', () => {
    const staticMatch = renderToString(
      <Router history={createMemoryHistory([ '/foo' ])}>
        <Match pattern="/:name" render={() => (
          <div>
            <Match pattern="/foo" render={() => <div>static</div>}/>
            <Miss render={({ params }) => <div>{params.name}</div>}/>
          </div>
        )}/>
      </Router>
    )
    expect(staticMatch).toContain('static')
    expect(staticMatch).toNotContain('foo')

    const paramMatch = renderToString(
      <Router history={createMemoryHistory([ '/bar' ])}>
        <Match pattern="/:name" render={({ pattern, params }) => (
          <div>
            <Match pattern="/foo" render={() => <div>static</div>}/>
            <Match pattern="/bar" render={() => <div>bar</div>}/>

            {/* I would expect this to work... */}
            <Miss render={() => <div>{params.name}</div>}/>

            {/* but this does */}
            {!matchPattern(pattern, location) && (
              <div>{params.name}</div>
            )}
          </div>
        )}/>
      </Router>
    )

    expect(paramMatch).toNotContain('static')
    expect(paramMatch).toContain('bar')
  })


})


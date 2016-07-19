import expect, { spyOn } from 'expect'
import React, { Component } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'

import createMemoryHistory from '../createMemoryHistory'
import Link from '../Link'
import match from '../match'
import Router from '../Router'
import RouterContext from '../RouterContext'

describe('server rendering', function () {

  class App extends Component {
    render() {
      return (
        <div className="App">
          <h1>App</h1>
          <Link to="/about" activeClassName="about-is-active">About</Link>{' '}
          <Link to="/dashboard" activeClassName="dashboard-is-active">Dashboard</Link>
          <div>
            {this.props.children}
          </div>
        </div>
      )
    }
  }

  class Dashboard extends Component {
    render() {
      return (
        <div className="Dashboard">
          <h1>The Dashboard</h1>
        </div>
      )
    }
  }

  class About extends Component {
    render() {
      return (
        <div className="About">
          <h1>About</h1>
        </div>
      )
    }
  }

  class Async extends Component {
    render() {
      return (
        <div className="Async">
          <h1>Async</h1>
          <Link to="/async" activeClassName="async-is-active">Link</Link>
        </div>
      )
    }
  }

  const DashboardRoute = {
    path: '/dashboard',
    component: Dashboard
  }

  const AboutRoute = {
    path: '/about',
    component: About
  }

  const RedirectRoute = {
    path: '/company',
    onEnter(nextState, replace) {
      replace('/about')
    }
  }

  const AsyncRoute = {
    path: '/async',
    getComponent(location, cb) {
      setTimeout(() => cb(null, Async))
    }
  }

  const routes = {
    path: '/',
    component: App,
    childRoutes: [ DashboardRoute, AboutRoute, RedirectRoute, AsyncRoute ]
  }

  it('works for synchronous route', function (done) {
    match({ routes, location: '/dashboard' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/The Dashboard/)
      done()
    })
  })

  it('works for asynchronous route', function (done) {
    match({ routes, location: '/async' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/Async/)
      done()
    })
  })

  it('accepts a custom history', function (done) {
    const history = createMemoryHistory()
    const spy = spyOn(history, 'createLocation').andCallThrough()

    match({ history, routes, location: '/dashboard' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/The Dashboard/)
      expect(spy).toHaveBeenCalled()
      done()
    })
  })


  it('renders active Links as active', function (done) {
    match({ routes, location: '/about' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/about-is-active/)
      expect(string).toNotMatch(/dashboard-is-active/)
      done()
    })
  })

  it('sends the redirect location', function (done) {
    match({ routes, location: '/company' }, function (error, redirectLocation) {
      expect(redirectLocation).toExist()
      expect(redirectLocation.pathname).toEqual('/about')
      expect(redirectLocation.search).toEqual('')
      expect(redirectLocation.state).toEqual(null)
      expect(redirectLocation.action).toEqual('REPLACE')
      done()
    })
  })

  it('sends null values when no routes match', function (done) {
    match({ routes, location: '/no-match' }, function (error, redirectLocation, state) {
      expect(error).toNotExist()
      expect(redirectLocation).toNotExist()
      expect(state).toNotExist()
      done()
    })
  })

  it('includes params and location in the props', function (done) {
    match({ routes, location: '/dashboard' }, function (error, redirectLocation, renderProps) {
      expect(renderProps.params).toEqual({})
      expect(renderProps.router.params).toEqual({})

      expect(renderProps.location.pathname).toEqual('/dashboard')
      expect(renderProps.router.location.pathname).toEqual('/dashboard')
      done()
    })
  })

  it('accepts a basename option', function (done) {
    match({ routes, location: '/dashboard', basename: '/nasebame' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/\/nasebame/)
      done()
    })
  })

  it('supports basenames with trailing slash', function (done) {
    match({ routes, location: '/dashboard', basename: '/nasebame/' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/\/nasebame/)
      done()
    })
  })

  describe('server/client consistency', () => {
    // Just render to static markup here to avoid having to normalize markup.

    it('should match for synchronous route', () => {
      let serverString

      match({ routes, location: '/dashboard' }, (error, redirectLocation, renderProps) => {
        serverString = renderToStaticMarkup(
          <RouterContext {...renderProps} />
        )
      })

      const browserString = renderToStaticMarkup(
        <Router history={createMemoryHistory('/dashboard')} routes={routes} />
      )

      expect(browserString).toEqual(serverString)
    })

    it('should match for asynchronous route', done => {
      match({ routes, location: '/async' }, (error, redirectLocation, renderProps) => {
        const serverString = renderToStaticMarkup(
          <RouterContext {...renderProps} />
        )

        match({ history: createMemoryHistory('/async'), routes }, (error, redirectLocation, renderProps) => {
          const browserString = renderToStaticMarkup(
            <Router {...renderProps} />
          )

          expect(browserString).toEqual(serverString)
          expect(browserString).toMatch(/async-is-active/)

          done()
        })
      })
    })
  })
})

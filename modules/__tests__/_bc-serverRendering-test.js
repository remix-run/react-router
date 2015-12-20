import expect from 'expect'
import React, { Component } from 'react'
import { renderToString } from 'react-dom/server'
import match from '../match'
import RouterContext from '../RouterContext'
import Link from '../Link'

describe('v1 server rendering', function () {

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
    onEnter(nextState, replaceState) {
      replaceState(null, '/about')
    }
  }

  const routes = {
    path: '/',
    component: App,
    childRoutes: [ DashboardRoute, AboutRoute, RedirectRoute ]
  }

  it('works', function (done) {
    match({ routes, location: '/dashboard' }, function (error, redirectLocation, renderProps) {
      const string = renderToString(
        <RouterContext {...renderProps} />
      )
      expect(string).toMatch(/The Dashboard/)
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

})

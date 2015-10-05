/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React from 'react'
import createMemoryHistory from 'history/lib/createMemoryHistory'
import RoutingContext from '../RoutingContext'
import match from '../match'
import Link from '../Link'

describe('server rendering', function () {

  let App, Dashboard, About, RedirectRoute, AboutRoute, DashboardRoute, routes
  beforeEach(function () {
    App = React.createClass({
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
    })

    Dashboard = React.createClass({
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
          </div>
        )
      }
    })

    About = React.createClass({
      render() {
        return (
          <div className="About">
            <h1>About</h1>
          </div>
        )
      }
    })

    DashboardRoute = {
      path: '/dashboard',
      component: Dashboard
    }

    AboutRoute = {
      path: '/about',
      component: About
    }

    RedirectRoute = {
      path: '/company',
      onEnter(nextState, replaceState) {
        replaceState(null, '/about')
      }
    }

    routes = {
      path: '/',
      component: App,
      childRoutes: [ DashboardRoute, AboutRoute, RedirectRoute ]
    }
  })

  it('works', function (done) {
    const history = createMemoryHistory()
    const location = history.createLocation('/dashboard')
    match({ routes, history, location }, function (error, redirectLocation, renderProps) {
      const string = React.renderToString(
        <RoutingContext {...renderProps} />
      )
      expect(string).toMatch(/The Dashboard/)
      done()
    })
  })

  it('renders active Links as active', function (done) {
    const history = createMemoryHistory()
    const location = history.createLocation('/about')
    match({ routes, history, location }, function (error, redirectLocation, renderProps) {
      const string = React.renderToString(
        <RoutingContext {...renderProps} />
      )
      expect(string).toMatch(/about-is-active/)
      //expect(string).toNotMatch(/dashboard-is-active/) TODO add toNotMatch to expect
      done()
    })
  })

  it('sends the redirect location', function (done) {
    const history = createMemoryHistory()
    const location = history.createLocation('/company')
    match({ routes, history, location }, function (error, redirectLocation) {
      expect(redirectLocation).toExist()
      expect(redirectLocation.pathname).toEqual('/about')
      expect(redirectLocation.search).toEqual('')
      expect(redirectLocation.state).toEqual(null)
      expect(redirectLocation.action).toEqual('REPLACE')
      done()
    })
  })

  it('sends null values when no routes match', function (done) {
    const history = createMemoryHistory()
    const location = history.createLocation('/no-match')
    match({ routes, history, location }, function (error, redirectLocation, state) {
      expect(error).toNotExist()
      expect(redirectLocation).toNotExist()
      expect(state).toNotExist()
      done()
    })
  })

})

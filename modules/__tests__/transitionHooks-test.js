/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect, { spyOn } from 'expect'
import React from 'react'
import createHistory from 'history/lib/createMemoryHistory'
import useQueries from 'history/lib/useQueries'
import execSteps from './execSteps'
import Router from '../Router'

describe('When a router enters a branch', function () {

  class Dashboard extends React.Component {
    render() {
      return (
        <div className="Dashboard">
          <h1>The Dashboard</h1>
          {this.props.children}
        </div>
      )
    }
  }

  class NewsFeed extends React.Component {
    render() {
      return <div>News</div>
    }
  }

  class Inbox extends React.Component {
    render() {
      return <div>Inbox</div>
    }
  }

  let node, DashboardRoute, NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, routes
  beforeEach(function () {
    node = document.createElement('div')

    NewsFeedRoute = {
      path: 'news',
      component: NewsFeed,
      onEnter(nextState, replaceState) {
        expect(this).toBe(NewsFeedRoute)
        expect(nextState.routes).toContain(NewsFeedRoute)
        expect(replaceState).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(NewsFeedRoute)
      }
    }

    InboxRoute = {
      path: 'inbox',
      component: Inbox,
      onEnter(nextState, replaceState) {
        expect(this).toBe(InboxRoute)
        expect(nextState.routes).toContain(InboxRoute)
        expect(replaceState).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(InboxRoute)
      }
    }

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, replaceState) {
        expect(this).toBe(RedirectToInboxRoute)
        expect(nextState.routes).toContain(RedirectToInboxRoute)
        expect(replaceState).toBeA('function')

        replaceState(null, '/inbox')
      },
      onLeave() {
        expect(this).toBe(RedirectToInboxRoute)
      }
    }

    MessageRoute = {
      path: 'messages/:messageID',
      onEnter(nextState, replaceState) {
        expect(this).toBe(MessageRoute)
        expect(nextState.routes).toContain(MessageRoute)
        expect(replaceState).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(MessageRoute)
      }
    }

    DashboardRoute = {
      component: Dashboard,
      onEnter(nextState, replaceState) {
        expect(this).toBe(DashboardRoute)
        expect(nextState.routes).toContain(DashboardRoute)
        expect(replaceState).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(DashboardRoute)
      },
      childRoutes: [ NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute ]
    }

    routes = [
      DashboardRoute
    ]
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  it('calls the onEnter hooks of all routes in that branch', function (done) {
    const dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough()
    const newsFeedRouteEnterSpy = spyOn(NewsFeedRoute, 'onEnter').andCallThrough()

    React.render(<Router history={createHistory('/news')} routes={routes}/>, node, function () {
      expect(dashboardRouteEnterSpy).toHaveBeenCalled()
      expect(newsFeedRouteEnterSpy).toHaveBeenCalled()
      done()
    })
  })

  describe('and one of the transition hooks navigates to another route', function () {
    it('immediately transitions to the new route', function (done) {
      const redirectRouteEnterSpy = spyOn(RedirectToInboxRoute, 'onEnter').andCallThrough()
      const redirectRouteLeaveSpy = spyOn(RedirectToInboxRoute, 'onLeave').andCallThrough()
      const inboxEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough()

      React.render(<Router history={createHistory('/redirect-to-inbox')} routes={routes}/>, node, function () {
        expect(this.state.location.pathname).toEqual('/inbox')
        expect(redirectRouteEnterSpy).toHaveBeenCalled()
        expect(redirectRouteLeaveSpy.calls.length).toEqual(0)
        expect(inboxEnterSpy).toHaveBeenCalled()
        done()
      })
    })
  })

  describe('and then navigates to another branch', function () {
    it('calls the onLeave hooks of all routes in the previous branch that are not in the next branch', function (done) {
      const dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough()
      const inboxRouteEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough()
      const inboxRouteLeaveSpy = spyOn(InboxRoute, 'onLeave').andCallThrough()

      const steps = [
        function () {
          expect(inboxRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called')
          this.history.pushState(null, '/news')
        },
        function () {
          expect(inboxRouteLeaveSpy).toHaveBeenCalled('InboxRoute.onLeave was not called')
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called')
        }
      ]

      const execNextStep = execSteps(steps, done)

      React.render(
        <Router history={createHistory('/inbox')}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep)
    })
  })

  describe('and then navigates to the same branch, but with different params', function () {
    it('calls the onLeave and onEnter hooks of all routes whose params have changed', function (done) {
      const dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough()
      const dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough()
      const messageRouteLeaveSpy = spyOn(MessageRoute, 'onLeave').andCallThrough()
      const messageRouteEnterSpy = spyOn(MessageRoute, 'onEnter').andCallThrough()

      const steps = [
        function () {
          expect(dashboardRouteEnterSpy).toHaveBeenCalled('DashboardRoute.onEnter was not called')
          expect(messageRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called')
          this.history.pushState(null, '/messages/456')
        },
        function () {
          expect(messageRouteLeaveSpy).toHaveBeenCalled('MessageRoute.onLeave was not called')
          expect(messageRouteEnterSpy).toHaveBeenCalled('MessageRoute.onEnter was not called')
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called')
        }
      ]

      const execNextStep = execSteps(steps, done)

      React.render(
        <Router history={createHistory('/messages/123')}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep)
    })
  })

  describe('and then the query changes', function () {
    it('calls the onEnter hooks of all routes in that branch', function (done) {
      const newsFeedRouteEnterSpy = spyOn(NewsFeedRoute, 'onEnter').andCallThrough()
      const history = useQueries(createHistory)('/inbox')

      React.render(<Router history={history} routes={routes}/>, node, function () {
        history.pushState(null, '/news', { q: 1 })
        expect(newsFeedRouteEnterSpy.calls.length).toEqual(1)
        history.pushState(null, '/news', { q: 2 })
        expect(newsFeedRouteEnterSpy.calls.length).toEqual(2)
        done()
      })
    })
  })

})

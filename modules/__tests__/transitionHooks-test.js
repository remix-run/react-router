import expect, { spyOn } from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from '../createMemoryHistory'
import { routerShape } from '../PropTypes'
import execSteps from './execSteps'
import Router from '../Router'

describe('When a router enters a branch', function () {
  let
    node,
    newsLeaveHookSpy, removeNewsLeaveHook, userLeaveHookSpy,
    DashboardRoute, NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, UserRoute, AssignmentRoute,
    routes

  beforeEach(function () {
    node = document.createElement('div')
    newsLeaveHookSpy = expect.createSpy()
    userLeaveHookSpy = expect.createSpy()

    class Dashboard extends Component {
      render() {
        return (
          <div className="Dashboard">
            <h1>The Dashboard</h1>
            {this.props.children}
          </div>
        )
      }
    }

    class NewsFeed extends Component {
      componentWillMount() {
        removeNewsLeaveHook = this.context.router.setRouteLeaveHook(
          this.props.route,
          () => newsLeaveHookSpy() // Break reference equality.
        )
      }

      render() {
        return <div>News</div>
      }
    }

    NewsFeed.contextTypes = {
      router: routerShape.isRequired
    }

    class Inbox extends Component {
      render() {
        return <div>Inbox</div>
      }
    }

    class UserAssignment extends Component {
      render() {
        return <div>assignment {this.props.params.assignmentId}</div>
      }
    }

    class User extends Component {
      componentWillMount() {
        this.context.router.setRouteLeaveHook(
          this.props.route,
          userLeaveHookSpy
        )
      }

      render() {
        return <div>User {this.props.params.userId} {this.props.children}</div>
      }
    }

    User.contextTypes = {
      router: routerShape.isRequired
    }

    NewsFeedRoute = {
      path: 'news',
      component: NewsFeed,
      onEnter(nextState, replace) {
        expect(this).toBe(NewsFeedRoute)
        expect(nextState.routes).toContain(NewsFeedRoute)
        expect(replace).toBeA('function')
      },
      onChange(prevState, nextState, replace) {
        expect(this).toBe(NewsFeedRoute)
        expect(prevState).toNotEqual(nextState)
        expect(prevState.routes).toContain(NewsFeedRoute)
        expect(nextState.routes).toContain(NewsFeedRoute)
        expect(replace).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(NewsFeedRoute)
      }
    }

    InboxRoute = {
      path: 'inbox',
      component: Inbox,
      onEnter(nextState, replace) {
        expect(this).toBe(InboxRoute)
        expect(nextState.routes).toContain(InboxRoute)
        expect(replace).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(InboxRoute)
      }
    }

    RedirectToInboxRoute = {
      path: 'redirect-to-inbox',
      onEnter(nextState, replace) {
        expect(this).toBe(RedirectToInboxRoute)
        expect(nextState.routes).toContain(RedirectToInboxRoute)
        expect(replace).toBeA('function')

        replace('/inbox')
      },
      onLeave() {
        expect(this).toBe(RedirectToInboxRoute)
      }
    }

    MessageRoute = {
      path: 'messages/:messageID',
      onEnter(nextState, replace) {
        expect(this).toBe(MessageRoute)
        expect(nextState.routes).toContain(MessageRoute)
        expect(replace).toBeA('function')
      },
      onChange(prevState, nextState, replace) {
        expect(this).toBe(MessageRoute)
        expect(prevState.routes).toContain(MessageRoute)
        expect(nextState.routes).toContain(MessageRoute)
        expect(replace).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(MessageRoute)
      }
    }

    AssignmentRoute = {
      path: 'assignments/:assignmentId',
      component: UserAssignment,
      onEnter() { expect(this).toBe(AssignmentRoute) },
      onLeave() { expect(this).toBe(AssignmentRoute) }
    }

    UserRoute = {
      path: 'users/:userId',
      component: User,
      childRoutes: [ AssignmentRoute ],
      onEnter() { expect(this).toBe(UserRoute) },
      onLeave() { expect(this).toBe(UserRoute) }
    }

    DashboardRoute = {
      path: '/',
      component: Dashboard,
      onEnter(nextState, replace) {
        expect(this).toBe(DashboardRoute)
        expect(nextState.routes).toContain(DashboardRoute)
        expect(replace).toBeA('function')
      },
      onChange(prevState, nextState, replace) {
        expect(this).toBe(DashboardRoute)
        expect(prevState).toNotEqual(nextState)
        expect(prevState.routes).toContain(DashboardRoute)
        expect(nextState.routes).toContain(DashboardRoute)
        expect(replace).toBeA('function')
      },
      onLeave() {
        expect(this).toBe(DashboardRoute)
      },
      childRoutes: [ NewsFeedRoute, InboxRoute, RedirectToInboxRoute, MessageRoute, UserRoute ]
    }

    routes = [
      DashboardRoute
    ]
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('calls the onEnter hooks of all routes in that branch', function (done) {
    const dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough()
    const newsFeedRouteEnterSpy = spyOn(NewsFeedRoute, 'onEnter').andCallThrough()

    render(<Router history={createHistory('/news')} routes={routes}/>, node, function () {
      expect(dashboardRouteEnterSpy).toHaveBeenCalled()
      expect(newsFeedRouteEnterSpy).toHaveBeenCalled()
      done()
    })
  })

  it('calls the route leave hooks when leaving the route', function (done) {
    const history = createHistory('/news')

    render(<Router history={history} routes={routes}/>, node, function () {
      expect(newsLeaveHookSpy.calls.length).toEqual(0)
      history.push('/inbox')
      expect(newsLeaveHookSpy.calls.length).toEqual(1)
      history.push('/news')
      expect(newsLeaveHookSpy.calls.length).toEqual(1)
      history.push('/inbox')
      expect(newsLeaveHookSpy.calls.length).toEqual(2)
      done()
    })
  })

  it('does not call removed route leave hooks', function (done) {
    const history = createHistory('/news')

    render(<Router history={history} routes={routes}/>, node, function () {
      removeNewsLeaveHook()
      history.push('/inbox')
      expect(newsLeaveHookSpy).toNotHaveBeenCalled()
      done()
    })
  })

  it('does not remove route leave hooks when changing params', function (done) {
    const history = createHistory('/users/foo')

    // Stub this function to exercise the code path.
    history.listenBeforeUnload = () => (() => {})

    render(<Router history={history} routes={routes}/>, node, function () {
      expect(userLeaveHookSpy.calls.length).toEqual(0)
      history.push('/users/bar')
      expect(userLeaveHookSpy.calls.length).toEqual(1)
      history.push('/users/baz')
      expect(userLeaveHookSpy.calls.length).toEqual(2)
      done()
    })
  })

  describe('and one of the transition hooks navigates to another route', function () {
    it('immediately transitions to the new route', function (done) {
      const redirectRouteEnterSpy = spyOn(RedirectToInboxRoute, 'onEnter').andCallThrough()
      const redirectRouteLeaveSpy = spyOn(RedirectToInboxRoute, 'onLeave').andCallThrough()
      const inboxEnterSpy = spyOn(InboxRoute, 'onEnter').andCallThrough()

      render(<Router history={createHistory('/redirect-to-inbox')} routes={routes}/>, node, function () {
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
      const history = createHistory('/inbox')

      const steps = [
        function () {
          expect(inboxRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called')
          history.push('/news')
        },
        function () {
          expect(inboxRouteLeaveSpy).toHaveBeenCalled('InboxRoute.onLeave was not called')
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render(
        <Router history={history}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep)
    })
  })

  describe('and then navigates to the same branch, but with different params', function () {
    it('calls the onLeave and onEnter hooks of all routes whose params have changed', function (done) {
      const dashboardRouteLeaveSpy = spyOn(DashboardRoute, 'onLeave').andCallThrough()
      const dashboardRouteChangeSpy = spyOn(DashboardRoute, 'onChange').andCallThrough()
      const dashboardRouteEnterSpy = spyOn(DashboardRoute, 'onEnter').andCallThrough()

      const messageRouteLeaveSpy = spyOn(MessageRoute, 'onLeave').andCallThrough()
      const messageRouteChangeSpy = spyOn(MessageRoute, 'onChange').andCallThrough()
      const messageRouteEnterSpy = spyOn(MessageRoute, 'onEnter').andCallThrough()
      const history = createHistory('/messages/123')

      const steps = [
        function () {
          expect(dashboardRouteEnterSpy).toHaveBeenCalled('DashboardRoute.onEnter was not called')
          expect(messageRouteEnterSpy).toHaveBeenCalled('InboxRoute.onEnter was not called')
          history.push('/messages/456')
        },
        function () {
          expect(messageRouteLeaveSpy).toHaveBeenCalled('MessageRoute.onLeave was not called')
          expect(messageRouteEnterSpy).toHaveBeenCalled('MessageRoute.onEnter was not called')
          expect(messageRouteChangeSpy.calls.length).toEqual(0, 'DashboardRoute.onChange was called')

          expect(dashboardRouteChangeSpy).toHaveBeenCalled('DashboardRoute.onChange was not called')
          expect(dashboardRouteLeaveSpy.calls.length).toEqual(0, 'DashboardRoute.onLeave was called')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render(
        <Router history={history}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep)
    })
  })

  describe('and then navigates to the same branch, but with different parent params', function () {
    it('calls the onLeave and onEnter hooks of the parent and children', function (done) {
      const parentLeaveSpy = spyOn(UserRoute, 'onLeave').andCallThrough()
      const parentEnterSpy = spyOn(UserRoute, 'onEnter').andCallThrough()
      const childLeaveSpy = spyOn(AssignmentRoute, 'onLeave').andCallThrough()
      const childEnterSpy = spyOn(AssignmentRoute, 'onEnter').andCallThrough()
      const history = createHistory('/users/123/assignments/456')

      const steps = [
        function () {
          expect(parentEnterSpy).toHaveBeenCalled()
          expect(childEnterSpy).toHaveBeenCalled()
          history.push('/users/789/assignments/456')
        },
        function () {
          expect(parentLeaveSpy).toHaveBeenCalled()
          expect(childLeaveSpy).toHaveBeenCalled()
          expect(parentEnterSpy).toHaveBeenCalled()
          expect(childEnterSpy).toHaveBeenCalled()
        }
      ]

      const execNextStep = execSteps(steps, done)

      render(
        <Router history={history}
                routes={routes}
                onUpdate={execNextStep}
        />, node, execNextStep)
    })
  })

  describe('and then the query changes', function () {
    it('calls the onEnter hooks of all routes in that branch', function (done) {
      const newsFeedRouteEnterSpy = spyOn(NewsFeedRoute, 'onEnter').andCallThrough()
      const newsFeedRouteChangeSpy = spyOn(NewsFeedRoute, 'onChange').andCallThrough()
      const history = createHistory('/inbox')

      render(<Router history={history} routes={routes}/>, node, function () {
        history.push({ pathname: '/news', query: { q: 1 } })
        expect(newsFeedRouteChangeSpy.calls.length).toEqual(0, 'NewsFeedRoute.onChange was called')
        expect(newsFeedRouteEnterSpy.calls.length).toEqual(1)

        history.push({ pathname: '/news', query: { q: 2 } })
        expect(newsFeedRouteChangeSpy).toHaveBeenCalled('NewsFeedRoute.onChange was not called')
        expect(newsFeedRouteEnterSpy.calls.length).toEqual(1)
        done()
      })
    })
  })

})

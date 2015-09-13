/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React from 'react'
import { createRoutesFromReactChildren } from '../RouteUtils'
import IndexRoute from '../IndexRoute'
import Route from '../Route'

describe('createRoutesFromReactChildren', function () {

  const Parent = React.createClass({
    render() {
      return (
        <div>
          <h1>Parent</h1>
          {this.props.children}
        </div>
      )
    }
  })

  const Hello = React.createClass({
    render() {
      return <div>Hello</div>
    }
  })

  const Goodbye = React.createClass({
    render() {
      return <div>Goodbye</div>
    }
  })

  it('works with index routes', function () {
    const routes = createRoutesFromReactChildren(
      <Route path="/" component={Parent}>
        <IndexRoute component={Hello} />
      </Route>
    )

    expect(routes).toEqual([
      {
        path: '/',
        component: Parent,
        indexRoute: {
          component: Hello
        }
      }
    ])
  })

  it('works with nested routes', function () {
    const routes = createRoutesFromReactChildren(
      <Route component={Parent}>
        <Route path="home" components={{ hello: Hello, goodbye: Goodbye }} />
      </Route>
    )

    expect(routes).toEqual([
      {
        component: Parent,
        childRoutes: [
          {
            path: 'home',
            components: { hello: Hello, goodbye: Goodbye }
          }
        ]
      }
    ])
  })

  it('works with falsy children', function () {
    const routes = createRoutesFromReactChildren([
      <Route path="/one" component={Parent} />,
      null,
      <Route path="/two" component={Parent} />,
      undefined
    ])

    expect(routes).toEqual([
      {
        path: '/one',
        component: Parent
      }, {
        path: '/two',
        component: Parent
      }
    ])
  })

  it('works with comments', function () {
    const routes = createRoutesFromReactChildren(
      <Route path="/one" component={Parent}>
        // This is a comment.
        <Route path="/two" component={Hello} />
      </Route>
    )

    expect(routes).toEqual([
      {
        path: '/one',
        component: Parent,
        childRoutes: [
          {
            path: '/two',
            component: Hello
          }
        ]
      }
    ])
  })

})

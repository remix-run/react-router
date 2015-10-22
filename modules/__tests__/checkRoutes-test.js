/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect, { spyOn } from 'expect'
import React, { Component } from 'react'
import { checkRoutes } from '../RouteUtils'

describe('checkRoutes', function () {

  class Parent extends Component {
    render() {
      return (
        <div>
          <h1>Parent</h1>
          {this.props.children}
        </div>
      )
    }
  }

  class Child extends Component {
    render() {
      return (
        <p>Child Component</p>
      )
    }
  }

  it('does not warn if all routes are reachable', function () {
    const routes = [ {
      component: Parent,
      childRoutes: [
        {
          path: 'home',
          component: Child
        },
        {
          path: 'about',
          component: Child
        }
      ]
    } ]

    const spy = spyOn(console, 'error')

    checkRoutes(routes)

    expect(spy.calls.length).toEqual(0)
  })

  it('warns if there is an unreachable route', function () {
    const routes = [ {
      component: Parent,
      childRoutes: [
        {
          path: 'home',
          component: Child
        },
        {
          path: 'home',
          component: Child
        }
      ]
    } ]

    const spy = spyOn(console, 'error')

    checkRoutes(routes)

    expect(spy).toHaveBeenCalledWith(
      `Warning: There are duplicate child routes with the path 'home'`
    )
  })

})

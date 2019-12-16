/*
 * Copyright (c) 2019 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import expect from 'expect'
import React, { Component } from 'react'
import { createRoutesFromReactChildren } from '../RouteUtils'
import IndexRoute from '../IndexRoute'
import Route from '../Route'

describe('createRoutesFromReactChildren', function () {

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

  class Hello extends Component {
    render() {
      return <div>Hello</div>
    }
  }

  class Goodbye extends Component {
    render() {
      return <div>Goodbye</div>
    }
  }

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
        { /* This is a comment */ }
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

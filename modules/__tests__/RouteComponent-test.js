import expect from 'expect'
import React, { Component } from 'react'
import { render } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import Router from '../Router'

describe('a Route Component', function () {
  it('injects the right props', function () {
    class Parent extends Component {
      componentDidMount() {
        expect(this.props.route).toEqual(parent)
        expect(this.props.routes).toEqual([ parent, child ])
      }
      render() {
        return null
      }
    }

    class Child extends Component {
      render() {
        return null
      }
    }

    const child = { path: 'child', component: Child }
    const parent = { path: '/', component: Parent, childRoutes: [ child ] }

    render(<Router history={createHistory('/child')} routes={parent} />)
  })
})

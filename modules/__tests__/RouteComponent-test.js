/*eslint-env mocha */
import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'

const { object } = React.PropTypes

describe('a Route Component', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('injects the right props', function (done) {
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

    render((
      <Router history={createHistory('/child')} routes={parent}/>
    ), node, done)
  })

  it('receives the right context', function (done) {
    class RouteComponent extends Component {
      static contextTypes = {
        history: object.isRequired,
        location: object.isRequired
      }
      componentDidMount() {
        expect(this.context.history).toEqual(this.props.history)
        expect(this.context.location).toEqual(this.props.location)
      }
      render() {
        return null
      }
    }

    const route = { path: '/', component: RouteComponent }

    render((
      <Router history={createHistory('/')} routes={route}/>
    ), node, done)
  })

})

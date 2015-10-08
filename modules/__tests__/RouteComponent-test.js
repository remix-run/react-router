/*eslint-env mocha */
import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'

describe('a Route Component', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('injects the right props', function (done) {
    class Parent extends React.Component {
      componentDidMount() {
        assertProps(this.props)
      }
      render() {
        return null
      }
    }

    class Child extends React.Component {
      render() {
        return null
      }
    }

    const child = { path: 'child', component: Child }
    const parent = { path: '/', component: Parent, childRoutes: [ child ] }

    function assertProps(props) {
      expect(props.route).toEqual(parent)
      expect(props.routes).toEqual([ parent, child ])
    }

    render((
      <Router history={createHistory('/child')} routes={parent}/>
    ), node, done)
  })

})

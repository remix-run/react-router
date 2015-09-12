/*eslint-env mocha */
import expect from 'expect'
import React from 'react'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'

describe('a Route Component', function () {

  var node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  it('injects the right props', function (done) {
    var Parent = React.createClass({
      componentDidMount() {
        assertProps(this.props)
      },
      render() { return null }
    })

    var Child = React.createClass({
      render() { return null }
    })

    var child = { path: 'child', component: Child }
    var parent = { path: '/', component: Parent, childRoutes: [ child ] }

    function assertProps(props) {
      expect(props.route).toEqual(parent)
      expect(props.routes).toEqual([parent, child])
    }

    React.render((
      <Router history={createHistory('/child')} routes={parent}/>
    ), node, done)
  })

})

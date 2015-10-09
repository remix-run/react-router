/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'

describe('An <IndexRoute>', function () {

  class Parent extends Component {
    render() {
      return <div>parent {this.props.children}</div>
    }
  }

  class Child extends Component {
    render() {
      return <div>child</div>
    }
  }

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it("renders when its parent's URL matches exactly", function (done) {
    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={Parent}>
          <IndexRoute component={Child}/>
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent).toEqual('parent child')
      done()
    })
  })

  describe('nested deeply in the route hierarchy', function () {
    it("renders when its parent's URL matches exactly", function (done) {
      render((
        <Router history={createHistory('/test')}>
          <Route path="/" component={Parent}>
            <IndexRoute component={Child}/>
            <Route path="/test" component={Parent}>
              <IndexRoute component={Child}/>
            </Route>
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('parent parent child')
        done()
      })
    })
  })

})

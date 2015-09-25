/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React from 'react'
import createHistory from 'history/lib/createMemoryHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'

describe('an <IndexRoute/>', function () {

  const Parent = React.createClass({
    render() {
      return <div>parent {this.props.children}</div>
    }
  })

  const Child = React.createClass({
    render() {
      return <div>child </div>
    }
  })

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  it('renders when its parent’s url matches exactly', function (done) {
    React.render((
      <Router history={createHistory('/')}>
        <Route path="/" component={Parent}>
          <IndexRoute component={Child}/>
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toEqual('parent child')
      done()
    })
  })

  describe('nested deeply in the route hierarchy', function () {
    it('renders when its parent’s url matches exactly', function (done) {
      React.render((
        <Router history={createHistory('/test')}>
          <Route path="/" component={Parent}>
            <IndexRoute component={Child}/>
            <Route path="/test" component={Parent}>
              <IndexRoute component={Child}/>
            </Route>
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent.trim()).toEqual('parent parent child')
        done()
      })
    })
  })

})

/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React from 'react'
import createHistory from 'history/lib/createMemoryHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'
import IndexLink from '../IndexLink'

describe('an <IndexLink/>', function () {

  var node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  var App = React.createClass({
    render () {
      return (
        <div>
          <ul>
            <li><IndexLink id="appLink" to="/" activeClassName="active">app </IndexLink></li>
            <li><IndexLink id="deepLink" to="/deep" activeClassName="active">deep </IndexLink></li>
          </ul>
          {this.props.children}
        </div>
      )
    }
  })

  var Parent = React.createClass({
    render () {
      return <div>parent {this.props.children}</div>
    }
  })

  var Child = React.createClass({
    render () {
      return <div>child </div>
    }
  })

  var routes = (
    <Route path="/" component={App}>
      <IndexRoute component={Child}/>
      <Route path="/deep" component={Parent}>
        <IndexRoute component={Child}/>
      </Route>
    </Route>
  )

  describe('when linking to the root', function () {
    it('is active when the parent’s route is active', function (done) {
      React.render((
        <Router history={createHistory('/')} routes={routes}/>
      ), node, function () {
        expect(node.querySelector('#appLink').className).toEqual('active')
        expect(node.querySelector('#deepLink').className).toEqual('')
        done()
      })
    })
  })

  describe('when linking deep into the route hierarchy', function () {
    it('is active when the parent’s route is active', function (done) {
      React.render((
        <Router history={createHistory('/deep')} routes={routes}/>
      ), node, function () {
        expect(node.querySelector('#appLink').className).toEqual('')
        expect(node.querySelector('#deepLink').className).toEqual('active')
        done()
      })
    })
  })

})

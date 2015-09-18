/*eslint-env mocha */
import expect from 'expect'
import React from 'react'
import createHistory from '../History'
import createRouter from '../Router'
import createRoute from '../Route'
import createMemoryHistory from 'history/lib/createMemoryHistory'

const History = createHistory(React)
const Router = createRouter(React)
const Route = createRoute(React)


describe('History Mixin', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  it('assigns the history to the component instance', function (done) {
    let history = createMemoryHistory('/')

    function assertHistory() {
      expect(this.history).toExist()
    }

    let Component = React.createClass({
      mixins: [ History ],
      componentWillMount: assertHistory,
      render () { return null }
    })

    React.render((
      <Router history={history}>
        <Route path="/" component={Component} />
      </Router>
    ), node, done)
  })

})

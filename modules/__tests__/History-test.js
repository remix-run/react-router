/*eslint-env mocha */
import expect from 'expect'
import React from 'react'
import History from '../History'
import Router from '../Router'
import Route from '../Route'
import createHistory from 'history/lib/createMemoryHistory'

describe('History Mixin', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  it('assigns the history to the component instance', function (done) {
    let history = createHistory('/')

    function assertHistory() {
      expect(this.history).toExist()
    }

    let Component = React.createClass({
      mixins: [ History ],
      componentWillMount: assertHistory,
      render() { return null }
    })

    React.render((
      <Router history={history}>
        <Route path="/" component={Component} />
      </Router>
    ), node, done)
  })

})

import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
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
    unmountComponentAtNode(node)
  })

  it('assigns the history to the component instance', function (done) {
    const history = createHistory('/')

    const Component = React.createClass({
      mixins: [ History ],
      componentWillMount() {
        expect(this.history).toExist()
      },
      render() { return null }
    })

    render((
      <Router history={history}>
        <Route path="/" component={Component} />
      </Router>
    ), node, done)
  })

})

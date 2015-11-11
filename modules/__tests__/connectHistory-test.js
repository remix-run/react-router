import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Router from '../Router'
import Route from '../Route'
import connectHistory from '../connectHistory'
import createHistory from 'history/lib/createMemoryHistory'

describe('History Higher-Order Component', function () {

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('passes the history to the component instance as a prop', function (done) {
    const history = createHistory('/')

    const Container = React.createClass({
      render() {
        return <div><Component/></div>
      }
    })

    const Component = connectHistory(React.createClass({
      componentWillMount() {
        expect(this.props.history).toExist()
      },
      render() { return null }
    }))

    render((
      <Router history={history}>
        <Route path="/" component={Container} />
      </Router>
    ), node, done)
  })

})

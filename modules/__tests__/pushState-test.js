/*eslint-env mocha */
import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import resetHash from './resetHash'
import execSteps from './execSteps'
import Router from '../Router'
import Route from '../Route'

describe('pushState', function () {

  class Index extends Component {
    render() {
      return <h1>Index</h1>
    }
  }

  class Home extends Component {
    render() {
      return <h1>Home</h1>
    }
  }

  beforeEach(resetHash)

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  describe('when the target path contains a colon', function () {
    it('works', function (done) {
      const steps = [
        function () {
          expect(this.state.location.pathname).toEqual('/')
          this.history.pushState(null, '/home/hi:there')
        },
        function () {
          expect(this.state.location.pathname).toEqual('/home/hi:there')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router onUpdate={execNextStep}>
          <Route path="/" component={Index}/>
          <Route path="/home/hi:there" component={Home}/>
        </Router>
      ), node, execNextStep)
    })
  })

})

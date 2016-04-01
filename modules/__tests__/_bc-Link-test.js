import expect, { spyOn } from 'expect'
import React, { Component } from 'react'
import { Simulate } from 'react-addons-test-utils'
import { render } from 'react-dom'
import execSteps from './execSteps'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'
import Route from '../Route'
import Link from '../Link'

const { click } = Simulate

describe('v1 Link', function () {

  class Hello extends Component {
    render() {
      return <div>Hello {this.props.params.name}!</div>
    }
  }

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  it('knows how to make its href', function () {
    class LinkWrapper extends Component {
      render() {
        return <Link to="/hello/michael" query={{ the: 'query' }} hash="#the-hash">Link</Link>
      }
    }

    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={LinkWrapper} />
      </Router>
    ), node, function () {
      const a = node.querySelector('a')
      expect(a.getAttribute('href')).toEqual('/hello/michael?the=query#the-hash')
    })
  })

  describe('with params', function () {
    class App extends Component {
      render() {
        return (
          <div>
            <Link
              to="/hello/michael"
              activeClassName="active"
            >
              Michael
            </Link>
            <Link
              to="/hello/ryan" query={{ the: 'query' }}
              activeClassName="active"
            >
              Ryan
            </Link>
          </div>
        )
      }
    }

    it('is active when its params match', function (done) {
      render((
        <Router history={createHistory('/hello/michael')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, function () {
        const a = node.querySelectorAll('a')[0]
        expect(a.className.trim()).toEqual('active')
        done()
      })
    })

    it('is not active when its params do not match', function (done) {
      render((
        <Router history={createHistory('/hello/michael')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, function () {
        const a = node.querySelectorAll('a')[1]
        expect(a.className.trim()).toEqual('')
        done()
      })
    })

    it('is active when its params and query match', function (done) {
      render((
        <Router history={createHistory('/hello/ryan?the=query')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, function () {
        const a = node.querySelectorAll('a')[1]
        expect(a.className.trim()).toEqual('active')
        done()
      })
    })

    it('is not active when its query does not match', function (done) {
      render((
        <Router history={createHistory('/hello/ryan?the=other+query')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, function () {
        const a = node.querySelectorAll('a')[1]
        expect(a.className.trim()).toEqual('')
        done()
      })
    })
  })

  it('transitions to the correct route with deprecated props', function (done) {
    class LinkWrapper extends Component {
      handleClick() {
        // just here to make sure click handlers don't prevent it from happening
      }
      render() {
        return <Link to="/hello" hash="#world" query={{ how: 'are' }} state={{ you: 'doing?' }} onClick={(e) => this.handleClick(e)}>Link</Link>
      }
    }

    const history = createHistory('/')
    const spy = spyOn(history, 'push').andCallThrough()

    const steps = [
      function () {
        click(node.querySelector('a'), { button: 0 })
      },
      function () {
        expect(node.innerHTML).toMatch(/Hello/)
        expect(spy).toHaveBeenCalled()

        const { location } = this.state
        expect(location.pathname).toEqual('/hello')
        expect(location.search).toEqual('?how=are')
        expect(location.hash).toEqual('#world')
        expect(location.state).toEqual({ you: 'doing?' })
      }
    ]

    const execNextStep = execSteps(steps, done)

    render((
      <Router history={history} onUpdate={execNextStep}>
        <Route path="/" component={LinkWrapper} />
        <Route path="/hello" component={Hello} />
      </Router>
    ), node, execNextStep)
  })
})

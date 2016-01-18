import expect, { spyOn } from 'expect'
import React, { Component } from 'react'
import { Simulate } from 'react-addons-test-utils'
import { render } from 'react-dom'
import createHistory from '../createMemoryHistory'
import execSteps from './execSteps'
import Router from '../Router'
import Route from '../Route'
import Link from '../Link'

const { click } = Simulate

describe('A <Link>', function () {

  class Hello extends Component {
    render() {
      return <div>Hello {this.props.params.name}!</div>
    }
  }

  class Goodbye extends Component {
    render() {
      return <div>Goodbye</div>
    }
  }

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  it('knows how to make its href', function () {
    class LinkWrapper extends Component {
      render() {
        return (
          <Link to={{
            pathname: '/hello/michael',
            query: { the: 'query' },
            hash: '#the-hash'
          }}>
            Link
          </Link>
        )
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

  // This test needs to be in its own file with beforeEach(resetHash).
  //
  //it('knows how to make its href with HashHistory', function () {
  //  class LinkWrapper extends Component {
  //    render() {
  //      return <Link to="/hello/michael" query={{the: 'query'}}>Link</Link>
  //    }
  //  }

  //  render((
  //    <Router history={new HashHistory}>
  //      <Route path="/" component={LinkWrapper} />
  //    </Router>
  //  ), node, function () {
  //    const a = node.querySelector('a')
  //    expect(a.getAttribute('href')).toEqual('#/hello/michael?the=query')
  //  })
  //})

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
              to={{ pathname: '/hello/ryan', query: { the: 'query' } }}
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

  describe('when its route is active and className is empty', function () {
    it("it shouldn't have an active class", function (done) {
      class LinkWrapper extends Component {
        render() {
          return (
            <div>
              <Link to="/hello" className="dontKillMe" activeClassName="">Link</Link>
              {this.props.children}
            </div>
          )
        }
      }

      const history = createHistory('/goodbye')

      let a
      const steps = [
        function () {
          a = node.querySelector('a')
          expect(a.className).toEqual('dontKillMe')
          history.push('/hello')
        },
        function () {
          expect(a.className).toEqual('dontKillMe')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="goodbye" component={Goodbye} />
            <Route path="hello" component={Hello} />
          </Route>
        </Router>
      ), node, execNextStep)
    })
  })

  describe('when its route is active', function () {
    it('has its activeClassName', function (done) {
      class LinkWrapper extends Component {
        render() {
          return (
            <div>
              <Link to="/hello" className="dontKillMe" activeClassName="highlight">Link</Link>
              {this.props.children}
            </div>
          )
        }
      }

      let a
      const history = createHistory('/goodbye')
      const steps = [
        function () {
          a = node.querySelector('a')
          expect(a.className).toEqual('dontKillMe')
          history.push('/hello')
        },
        function () {
          expect(a.className).toEqual('dontKillMe highlight')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="goodbye" component={Goodbye} />
            <Route path="hello" component={Hello} />
          </Route>
        </Router>
      ), node, execNextStep)
    })

    it('has its activeStyle', function (done) {
      class LinkWrapper extends Component {
        render() {
          return (
            <div>
              <Link to="/hello" style={{ color: 'white' }} activeStyle={{ color: 'red' }}>Link</Link>
              {this.props.children}
            </div>
          )
        }
      }

      let a
      const history = createHistory('/goodbye')
      const steps = [
        function () {
          a = node.querySelector('a')
          expect(a.style.color).toEqual('white')
          history.push('/hello')
        },
        function () {
          expect(a.style.color).toEqual('red')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="hello" component={Hello} />
            <Route path="goodbye" component={Goodbye} />
          </Route>
        </Router>
      ), node, execNextStep)
    })
  })

  describe('when route changes', function () {
    it('changes active state', function (done) {
      class LinkWrapper extends Component {
        render() {
          return (
            <div>
              <Link to="/hello" activeClassName="active">Link</Link>
              {this.props.children}
            </div>
          )
        }
      }

      let a
      const history = createHistory('/goodbye')
      const steps = [
        function () {
          a = node.querySelector('a')
          expect(a.className).toEqual('')
          history.push('/hello')
        },
        function () {
          expect(a.className).toEqual('active')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router history={history} onUpdate={execNextStep}>
          <Route path="/" component={LinkWrapper}>
            <Route path="goodbye" component={Goodbye} />
            <Route path="hello" component={Hello} />
          </Route>
        </Router>
      ), node, execNextStep)
    })
  })

  describe('when clicked', function () {
    it('calls a user defined click handler', function (done) {
      class LinkWrapper extends Component {
        handleClick(event) {
          event.preventDefault()
          done()
        }
        render() {
          return <Link to="/hello" onClick={e => this.handleClick(e)}>Link</Link>
        }
      }

      render((
        <Router history={createHistory('/')}>
          <Route path="/" component={LinkWrapper} />
          <Route path="/hello" component={Hello} />
        </Router>
      ), node, () => {
        click(node.querySelector('a'))
      })
    })

    it('transitions to the correct route for string', function (done) {
      class LinkWrapper extends Component {
        render() {
          return (
            <Link to="/hello?the=query#hash">
              Link
            </Link>
          )
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
          expect(location.search).toEqual('?the=query')
          expect(location.hash).toEqual('#hash')
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

    it('transitions to the correct route for object', function (done) {
      class LinkWrapper extends Component {
        render() {
          return (
            <Link
              to={{
                pathname: '/hello',
                query: { how: 'are' },
                hash: '#world',
                state: { you: 'doing?' }
              }}
            >
              Link
            </Link>
          )
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

    it('does not transition when onClick prevents default', function (done) {
      class LinkWrapper extends Component {
        render() {
          return <Link to="/hello" onClick={(e) => e.preventDefault()}>Link</Link>
        }
      }

      const history = createHistory('/')
      const spy = spyOn(history, 'push').andCallThrough()

      const steps = [
        function () {
          click(node.querySelector('a'), { button: 0 })
        },
        function () {
          expect(node.innerHTML).toMatch(/Link/)
          expect(spy).toNotHaveBeenCalled()
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

})

import expect, { spyOn } from 'expect'
import React, { Component } from 'react'
import { Simulate } from 'react-dom/test-utils'
import { render } from 'react-dom'
import createHistory from '../createMemoryHistory'
import hashHistory from '../hashHistory'
import Router from '../Router'
import Route from '../Route'
import Link from '../Link'
import execSteps from './execSteps'

const { click } = Simulate

describe('A <Link>', () => {

  const Hello = ({ params }) => (
    <div>Hello {params.name}!</div>
  )

  const Goodbye = () => (
    <div>Goodbye</div>
  )

  let node
  beforeEach(() => {
    node = document.createElement('div')
  })

  it('should not render unnecessary class=""', () => {
    render((
      <Link to="/something" />
    ), node, () => {
      const a = node.querySelector('a')
      expect(a.hasAttribute('class')).toBe(false)
    })
  })

  it('knows how to make its href', () => {
    const LinkWrapper = () => (
      <Link to={{
        pathname: '/hello/michael',
        query: { the: 'query' },
        hash: '#the-hash'
      }}>
        Link
      </Link>
    )

    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={LinkWrapper} />
      </Router>
    ), node, () => {
      const a = node.querySelector('a')
      expect(a.getAttribute('href')).toEqual('/hello/michael?the=query#the-hash')
    })
  })

  describe('with hash history', () => {
    it('should know how to make its href', () => {
      const LinkWrapper = () => (
        <Link to={{ pathname: '/hello/michael', query: { the: 'query' } }}>
          Link
        </Link>
      )

      render((
        <Router history={hashHistory}>
          <Route path="/" component={LinkWrapper} />
        </Router>
      ), node, () => {
        const a = node.querySelector('a')
        expect(a.getAttribute('href')).toEqual('#/hello/michael?the=query')
      })
    })
  })

  describe('with params', () => {
    const App = () => (
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

    it('is active when its params match', done => {
      render((
        <Router history={createHistory('/hello/michael')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, () => {
        const a = node.querySelectorAll('a')[0]
        expect(a.className.trim()).toEqual('active')
        done()
      })
    })

    it('is not active when its params do not match', done => {
      render((
        <Router history={createHistory('/hello/michael')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, () => {
        const a = node.querySelectorAll('a')[1]
        expect(a.className.trim()).toEqual('')
        done()
      })
    })

    it('is active when its params and query match', done => {
      render((
        <Router history={createHistory('/hello/ryan?the=query')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, () => {
        const a = node.querySelectorAll('a')[1]
        expect(a.className.trim()).toEqual('active')
        done()
      })
    })

    it('is not active when its query does not match', done => {
      render((
        <Router history={createHistory('/hello/ryan?the=other+query')}>
          <Route path="/" component={App}>
            <Route path="hello/:name" component={Hello} />
          </Route>
        </Router>
      ), node, () => {
        const a = node.querySelectorAll('a')[1]
        expect(a.className.trim()).toEqual('')
        done()
      })
    })
  })

  describe('when its route is active and className is empty', () => {
    it("it shouldn't have an active class", done => {
      const LinkWrapper = ({ children }) => (
        <div>
          <Link to="/hello" className="dontKillMe" activeClassName="">
            Link
          </Link>
          {children}
        </div>
      )

      const history = createHistory('/goodbye')

      let a
      const steps = [
        () => {
          a = node.querySelector('a')
          expect(a.className).toEqual('dontKillMe')
          history.push('/hello')
        },
        () => {
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

  describe('when its route is active', () => {
    it('has its activeClassName', done => {
      const LinkWrapper = ({ children }) => (
        <div>
          <Link to="/hello" className="dontKillMe" activeClassName="highlight">
            Link
          </Link>
          {children}
        </div>
      )

      let a
      const history = createHistory('/goodbye')
      const steps = [
        () => {
          a = node.querySelector('a')
          expect(a.className).toEqual('dontKillMe')
          history.push('/hello')
        },
        () => {
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

    it('has its activeStyle', done => {
      const LinkWrapper = ({ children }) => (
        <div>
          <Link
            to="/hello"
            style={{ color: 'white' }}
            activeStyle={{ color: 'red' }}
          >
            Link
          </Link>
          {children}
        </div>
      )

      let a
      const history = createHistory('/goodbye')
      const steps = [
        () => {
          a = node.querySelector('a')
          expect(a.style.color).toEqual('white')
          history.push('/hello')
        },
        () => {
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

  describe('when route changes', () => {
    it('changes active state', done => {
      const LinkWrapper = ({ children }) => (
        <div>
          <Link to="/hello" activeClassName="active">Link</Link>
          {children}
        </div>
      )

      let a
      const history = createHistory('/goodbye')
      const steps = [
        () => {
          a = node.querySelector('a')
          expect(a.className).toEqual('')
          history.push('/hello')
        },
        () => {
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

    it('changes active state inside static containers', done => {
      class LinkWrapper extends Component {
        shouldComponentUpdate() {
          return false
        }

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
        () => {
          a = node.querySelector('a')
          expect(a.className).toEqual('')
          history.push('/hello')
        },
        () => {
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

  describe('when clicked', () => {
    it('calls a user defined click handler', done => {
      class LinkWrapper extends Component {
        handleClick() {
          done()
        }

        render() {
          return <Link to="/hello" onClick={this.handleClick}>Link</Link>
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

    it('transitions to the correct route for string', done => {
      const LinkWrapper = () => (
        <Link to="/hello?the=query#hash">
          Link
        </Link>
      )

      const history = createHistory('/')
      const spy = spyOn(history, 'push').andCallThrough()

      const steps = [
        () => {
          click(node.querySelector('a'), { button: 0 })
        },
        ({ location }) => {
          expect(node.innerHTML).toMatch(/Hello/)
          expect(spy).toHaveBeenCalled()

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

    it('transitions to the correct route for object', done => {
      const LinkWrapper = () => (
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

      const history = createHistory('/')
      const spy = spyOn(history, 'push').andCallThrough()

      const steps = [
        () => {
          click(node.querySelector('a'), { button: 0 })
        },
        ({ location }) => {
          expect(node.innerHTML).toMatch(/Hello/)
          expect(spy).toHaveBeenCalled()

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

    it('does not transition when onClick prevents default', done => {
      class LinkWrapper extends Component {
        handleClick(event) {
          event.preventDefault()
        }

        render() {
          return <Link to="/hello" onClick={this.handleClick}>Link</Link>
        }
      }

      const history = createHistory('/')
      const spy = spyOn(history, 'push').andCallThrough()

      const steps = [
        () => {
          click(node.querySelector('a'), { button: 0 })
        },
        () => {
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

  describe('with function to', () => {
    const LinkWrapper = () => (
      <Link
        to={location => ({ ...location, hash: '#hash' })}
        activeClassName="active"
      >
        Link
      </Link>
    )

    it('should have the correct href and active state', () => {
      render((
        <Router history={createHistory('/hello')}>
          <Route path="/hello" component={LinkWrapper} />
        </Router>
      ), node, () => {
        const a = node.querySelector('a')
        expect(a.getAttribute('href')).toEqual('/hello#hash')
        expect(a.className.trim()).toEqual('active')
      })
    })

    it('should transition correctly on click', done => {
      const steps = [
        () => {
          click(node.querySelector('a'), { button: 0 })
        },
        ({ location }) => {
          expect(location.pathname).toEqual('/hello')
          expect(location.hash).toEqual('#hash')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router history={createHistory('/hello')} onUpdate={execNextStep}>
          <Route path="/hello" component={LinkWrapper} />
        </Router>
      ), node, execSteps)
    })
  })

  describe('when the "to" prop is unspecified', function () {
    class App extends Component {
      render() {
        return (
          <div>
            <Link>Blank Link</Link>
            <Link/>
            <Link className="kitten-link">Kittens</Link>
          </div>
        )
      }
    }

    it('returns an anchor tag without an href', function (done) {
      render((
        <Router history={createHistory('/')}>
          <Route path="/" component={App} />
        </Router>
      ), node, function () {
        const link1 = node.querySelectorAll('a')[0]
        const link2 = node.querySelectorAll('a')[1]
        const link3 = node.querySelectorAll('a')[2]
        expect(link1.href).toEqual('')
        expect(link2.href).toEqual('')
        expect(link3.href).toEqual('')
        done()
      })
    })

    it('passes down other props', function (done) {
      render((
        <Router history={createHistory('/')}>
          <Route path="/" component={App} />
        </Router>
      ), node, function () {
        const link3 = node.querySelectorAll('a')[2]
        expect(link3.className).toEqual('kitten-link')
        done()
      })
    })
  })
})

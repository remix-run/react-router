import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Route from '../Route'
import Router from '../Router'
import RoutingContext from '../RoutingContext'

describe('Router', function () {

  class Parent extends Component {
    render() {
      return <div>parent {this.props.children}</div>
    }
  }

  class Child extends Component {
    render() {
      return <div>child</div>
    }
  }

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  it('renders routes', function (done) {
    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={Parent} />
      </Router>
    ), node, function () {
      expect(node.textContent).toEqual('parent ')
      done()
    })
  })

  it('renders child routes when the parent does not have a path', function (done) {
    render((
      <Router history={createHistory('/')}>
        <Route component={Parent}>
          <Route component={Parent}>
            <Route path="/" component={Child} />
          </Route>
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent).toEqual('parent parent child')
      done()
    })
  })

  it('renders nested children correctly', function (done) {
    render((
      <Router history={createHistory('/hello')}>
        <Route component={Parent}>
          <Route path="hello" component={Child} />
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent).toMatch(/parent/)
      expect(node.textContent).toMatch(/child/)
      done()
    })
  })

  it("renders the child's component when it has no component", function (done) {
    render((
      <Router history={createHistory('/hello')}>
        <Route>
          <Route path="hello" component={Child} />
        </Route>
      </Router>
    ), node, function () {
      expect(node.textContent).toMatch(/child/)
      done()
    })
  })

  it('renders with a custom "createElement" prop', function (done) {
    class Wrapper extends Component {
      render() {
        return <this.props.component fromWrapper="wrapped" />
      }
    }

    class Child extends Component {
      render() {
        return <div>{this.props.fromWrapper}</div>
      }
    }

    render((
      <Router history={createHistory('/')} createElement={x => <Wrapper component={x} />}>
        <Route path="/" component={Child}/>
      </Router>
    ), node, function () {
      expect(node.textContent).toEqual('wrapped')
      done()
    })
  })

  describe('with named components', function () {
    it('receives those components as props', function (done) {
      class Parent extends Component {
        render() {
          return (
            <div>{this.props.sidebar}-{this.props.content}</div>
          )
        }
      }

      class Sidebar extends Component {
        render() {
          return <div>sidebar</div>
        }
      }

      class Content extends Component {
        render() {
          return <div>content</div>
        }
      }

      render((
        <Router history={createHistory('/')}>
          <Route component={Parent}>
            <Route path="/" components={{ sidebar: Sidebar, content: Content }} />
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('sidebar-content')
        done()
      })
    })
  })

  describe('at a route with special characters', function () {
    it('does not double escape', function (done) {
      // https://github.com/rackt/react-router/issues/1574
      class MyComponent extends Component {
        render() {
          return <div>{this.props.params.someToken}</div>
        }
      }

      render((
        <Router history={createHistory('/point/aaa%2Bbbb')}>
          <Route path="point/:someToken" component={MyComponent} />
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('aaa+bbb')
        done()
      })
    })

    it('does not double escape when nested', function (done) {
      // https://github.com/rackt/react-router/issues/1574
      class MyWrapperComponent extends Component {
        render() {
          return this.props.children
        }
      }

      class MyComponent extends Component {
        render() {
          return <div>{this.props.params.someToken}</div>
        }
      }

      render((
        <Router history={createHistory('/point/aaa%2Bbbb')}>
          <Route component={MyWrapperComponent}>
            <Route path="point/:someToken" component={MyComponent} />
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('aaa+bbb')
        done()
      })
    })

    it('is happy to have colons in parameter values', function (done) {
      // https://github.com/rackt/react-router/issues/1759
      class MyComponent extends Component {
        render() {
          return <div>{this.props.params.foo}</div>
        }
      }

      render((
        <Router history={createHistory('/ns/aaa:bbb/bar')}>
          <Route path="ns/:foo/bar" component={MyComponent} />
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('aaa:bbb')
        done()
      })
    })

    it('handles % in parameters', function (done) {
      // https://github.com/rackt/react-router/issues/1766
      class MyComponent extends Component {
        render() {
          return <div>{this.props.params.name}</div>
        }
      }

      render((
        <Router history={createHistory('/company/CADENCE%20DESIGN%20SYSTEM%20INC%20NOTE%202.625%25%2060')}>
          <Route path="/company/:name" component={MyComponent} />
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('CADENCE DESIGN SYSTEM INC NOTE 2.625% 60')
        done()
      })
    })

    it('handles forward slashes', function (done) {
      // https://github.com/rackt/react-router/issues/1865
      class Parent extends Component {
        render() {
          return <div>{this.props.children}</div>
        }
      }

      class Child extends Component {
        render() {
          return <h1>{this.props.params.name}</h1>
        }
      }

      render((
        <Router history={createHistory('/apple%2Fbanana')}>
          <Route component={Parent}>
            <Route path="/:name" component={Child} />
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent).toEqual('apple/banana')
        done()
      })
    })

  })

  describe('RoutingContext', function () {
    it('applies custom RoutingContext', function (done) {
      const Parent = ({ children }) => <span>parent:{children}</span>
      const Child = () => <span>child</span>

      class LabelWrapper extends Component {
        static defaultProps = {
          createElement: React.createElement
        }

        createElement = (component, props) => {
          const { label, createElement } = this.props

          return (
            <span>
              {label}-inner:{createElement(component, props)}
            </span>
          )
        }

        render() {
          const { label, children } = this.props
          const child = React.cloneElement(children, {
            createElement: this.createElement
          })

          return (
            <span>
              {label}-outer:{child}
            </span>
          )
        }
      }

      const CustomRoutingContext = props => (
        <LabelWrapper label="m1">
          <LabelWrapper label="m2">
            <RoutingContext {...props} />
          </LabelWrapper>
        </LabelWrapper>
      )

      render((
        <Router
          history={createHistory('/child')}
          RoutingContext={CustomRoutingContext}
        >
          <Route path="/" component={Parent}>
            <Route path="child" component={Child} />
          </Route>
        </Router>
      ), node, function () {
        // Note that the nesting order is inverted for `createElement`, because
        // the order of function application is outermost-first.
        expect(node.textContent).toBe(
          'm1-outer:m2-outer:m2-inner:m1-inner:parent:m2-inner:m1-inner:child'
        )
        done()
      })
    })

    it('passes router props to custom RoutingContext', function (done) {
      const MyComponent = () => <div />
      const route = { path: '/', component: MyComponent }

      const Wrapper = (
        { routes, components, foo, RoutingContext, children }
      ) => {
        expect(routes).toEqual([ route ])
        expect(components).toEqual([ MyComponent ])
        expect(foo).toBe('bar')
        expect(RoutingContext).toNotExist()
        done()

        return children
      }
      const CustomRoutingContext = props => (
        <Wrapper {...props}>
          <RoutingContext {...props} />
        </Wrapper>
      )

      render((
        <Router
          history={createHistory('/')}
          routes={route}
          RoutingContext={CustomRoutingContext}
          foo="bar"
        />
      ), node)
    })

  })

  describe('async components', function () {
    let componentSpy, RoutingSpy

    beforeEach(function () {
      componentSpy = expect.createSpy()

      RoutingSpy = ({ components }) => {
        componentSpy(components)
        return <div />
      }
    })

    it('should support getComponent', function (done) {
      const Component = () => <div />
      const getComponent = (_, callback) => {
        setTimeout(() => callback(null, Component))
      }

      render((
        <Router history={createHistory('/')} RoutingContext={RoutingSpy}>
          <Route path="/" getComponent={getComponent} />
        </Router>
      ), node, function () {
        setTimeout(function () {
          expect(componentSpy).toHaveBeenCalledWith([ Component ])
          done()
        })
      })
    })

    it('should support getComponents', function (done) {
      const foo = () => <div />
      const bar = () => <div />

      const getComponents = (_, callback) => {
        setTimeout(() => callback(null, { foo, bar }))
      }

      render((
        <Router history={createHistory('/')} RoutingContext={RoutingSpy}>
          <Route path="/" getComponents={getComponents} />
        </Router>
      ), node, function () {
        setTimeout(function () {
          expect(componentSpy).toHaveBeenCalledWith([ { foo, bar } ])
          done()
        })
      })
    })
  })

  describe('error handling', function () {
    let error, getComponent

    beforeEach(function () {
      error = new Error('error fixture')
      getComponent = (_, callback) => callback(error)
    })

    it('should work with onError', function (done) {
      const errorSpy = expect.createSpy()

      render((
        <Router history={createHistory('/')} onError={errorSpy}>
          <Route path="/" getComponent={getComponent} />
        </Router>
      ), node, function () {
        expect(errorSpy).toHaveBeenCalledWith(error)
        done()
      })
    })

    it('should throw without onError', function () {
      expect(function () {
        render((
          <Router history={createHistory('/')}>
            <Route path="/" getComponent={getComponent} />
          </Router>
        ), node)
      }).toThrow('error fixture')
    })
  })
})

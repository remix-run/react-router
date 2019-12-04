import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from '../createMemoryHistory'
import Route from '../Route'
import Router from '../Router'

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

    let routes

    beforeEach(function () {
      routes = (
        <Route component={Parent}>
          <Route path="/" components={{ sidebar: Sidebar, content: Content }} />
        </Route>
      )
    })

    it('receives those components as props', function (done) {
      render((
        <Router history={createHistory('/')} routes={routes} />
      ), node, function () {
        expect(node.textContent).toEqual('sidebar-content')
        done()
      })
    })

    it('sets the key on those components', function (done) {
      const components = {}
      function createElementSpy(Component, props) {
        if (props.key) {
          components[props.key] = Component
        }

        return null
      }

      render((
        <Router
          history={createHistory('/')} routes={routes}
          createElement={createElementSpy}
        />
      ), node, function () {
        expect(components.sidebar).toBe(Sidebar)
        expect(components.content).toBe(Content)
        done()
      })
    })
  })

  describe('at a route with special characters', function () {
    it('does not double escape', function (done) {
      // https://github.com/reactjs/react-router/issues/1574
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
      // https://github.com/reactjs/react-router/issues/1574
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
      // https://github.com/reactjs/react-router/issues/1759
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
      // https://github.com/reactjs/react-router/issues/1766
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
      // https://github.com/reactjs/react-router/issues/1865
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

    it('handles error that are not valid URI character', function (done) {
      const errorSpy = expect.createSpy()

      render((
        <Router history={createHistory('/%')} onError={errorSpy}>
          <Route path="*" />
        </Router>
      ), node, function () {
        expect(errorSpy).toHaveBeenCalled()
        done()
      })
    })

  })

  describe('render prop', function () {
    it('renders with the render prop', function (done) {
      render((
        <Router
          history={createHistory('/')}
          render={() => <div>test</div>}
          routes={{ path: '/', component: Parent }}
        />
      ), node, function () {
        expect(node.textContent).toBe('test')
        done()
      })
    })

    it('passes router props to render prop', function (done) {
      const MyComponent = () => <div />
      const route = { path: '/', component: MyComponent }

      const assertProps = (props) => {
        expect(props.routes).toEqual([ route ])
        expect(props.components).toEqual([ MyComponent ])

        expect(props.params).toEqual({})
        expect(props.location.pathname).toEqual('/')
        expect(props.router.params).toEqual({})
        expect(props.router.location.pathname).toEqual('/')

        expect(props.foo).toBe('bar')
        expect(props.render).toNotExist()
        done()
        return <div/>
      }

      render((
        <Router
          history={createHistory('/')}
          routes={route}
          render={assertProps}
          foo="bar"
        />
      ), node)
    })

  })

  describe('async components', function () {
    let componentSpy, renderSpy

    beforeEach(function () {
      componentSpy = expect.createSpy()

      renderSpy = ({ components }) => {
        componentSpy(components)
        return <div />
      }
    })

    it('should support getComponent', function (done) {
      const Component = () => <div />

      function getComponent(nextState, callback) {
        expect(this.getComponent).toBe(getComponent)
        expect(nextState.location.pathname).toBe('/')

        setTimeout(() => callback(null, Component))
      }

      render((
        <Router history={createHistory('/')} render={renderSpy}>
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

      function getComponents(nextState, callback) {
        expect(this.getComponents).toBe(getComponents)
        expect(nextState.location.pathname).toBe('/')

        setTimeout(() => callback(null, { foo, bar }))
      }

      render((
        <Router history={createHistory('/')} render={renderSpy}>
          <Route path="/" getComponents={getComponents} />
        </Router>
      ), node, function () {
        setTimeout(function () {
          expect(componentSpy).toHaveBeenCalledWith([ { foo, bar } ])
          done()
        })
      })
    })

    it('should support getComponent returning a Promise', function (done) {
      const Component = () => <div />

      const getComponent = () => new Promise(resolve => resolve(Component))

      render((
        <Router history={createHistory('/')} render={renderSpy}>
          <Route path="/" getComponent={getComponent} />
        </Router>
      ), node, function () {
        setTimeout(function () {
          expect(componentSpy).toHaveBeenCalledWith([ Component ])
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

    it('should throw without onError', function (done) {
      const callback = expect(() => { done() }).toThrow('error fixture')
      render((
        <Router history={createHistory('/')}>
          <Route path="/" getComponent={getComponent} />
        </Router>
      ), node, callback)
    })
  })
})

/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'
import Route from '../Route'

describe('Router', function () {

  class Parent extends React.Component {
    render() {
      return <div>parent{this.props.children}</div>
    }
  }

  class Child extends React.Component {
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
      expect(node.textContent.trim()).toEqual('parent')
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
      expect(node.textContent.trim()).toEqual('parentparentchild')
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
      expect(node.textContent.trim()).toMatch(/parent/)
      expect(node.textContent.trim()).toMatch(/child/)
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
      expect(node.textContent.trim()).toMatch(/child/)
      done()
    })
  })

  it('renders with a custom "createElement" prop', function (done) {
    class Wrapper extends React.Component {
      render() {
        const { Component } = this.props
        return <Component fromWrapper="wrapped" />
      }
    }

    class Component extends React.Component {
      render() {
        return <div>{this.props.fromWrapper}</div>
      }
    }

    render((
      <Router history={createHistory('/')} createElement={Component => <Wrapper Component={Component} />}>
        <Route path="/" component={Component}/>
      </Router>
    ), node, function () {
      expect(node.textContent.trim()).toEqual('wrapped')
      done()
    })
  })

  describe('with named components', function () {
    it('renders the named components', function (done) {
      class Parent extends React.Component {
        render() {
          return (
            <div>
              {this.props.children.sidebar}-{this.props.children.content}
            </div>
          )
        }
      }

      class Sidebar extends React.Component {
        render() {
          return <div>sidebar</div>
        }
      }

      class Content extends React.Component {
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
        expect(node.textContent.trim()).toEqual('sidebar-content')
        done()
      })
    })
  })

  describe('at a route with special characters', function () {
    it('does not double escape', function (done) {
      // https://github.com/rackt/react-router/issues/1574
      class MyComponent extends React.Component {
        render() {
          return <div>{this.props.params.someToken}</div>
        }
      }

      render((
        <Router history={createHistory('/point/aaa%2Bbbb')}>
          <Route path="point/:someToken" component={MyComponent} />
        </Router>
      ), node, function () {
        expect(node.textContent.trim()).toEqual('aaa+bbb')
        done()
      })
    })

    it('does not double escape when nested', function (done) {
      // https://github.com/rackt/react-router/issues/1574
      class MyWrapperComponent extends React.Component {
        render() {
          return this.props.children
        }
      }

      class MyComponent extends React.Component {
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
        expect(node.textContent.trim()).toEqual('aaa+bbb')
        done()
      })
    })

    it('is happy to have colons in parameter values', function (done) {
      // https://github.com/rackt/react-router/issues/1759
      class MyComponent extends React.Component {
        render() {
          return <div>{this.props.params.foo}</div>
        }
      }

      render((
        <Router history={createHistory('/ns/aaa:bbb/bar')}>
          <Route path="ns/:foo/bar" component={MyComponent} />
        </Router>
      ), node, function () {
        expect(node.textContent.trim()).toEqual('aaa:bbb')
        done()
      })
    })

    it('handles % in parameters', function (done) {
      // https://github.com/rackt/react-router/issues/1766
      class MyComponent extends React.Component {
        render() {
          return <div>{this.props.params.name}</div>
        }
      }

      render((
        <Router history={createHistory('/company/CADENCE%20DESIGN%20SYSTEM%20INC%20NOTE%202.625%25%2060')}>
          <Route path="/company/:name" component={MyComponent} />
        </Router>
      ), node, function () {
        expect(node.textContent.trim()).toEqual('CADENCE DESIGN SYSTEM INC NOTE 2.625% 60')
        done()
      })
    })

    it('handles forward slashes', function (done) {
      // https://github.com/rackt/react-router/issues/1865
      class Parent extends React.Component {
        render() {
          return <div>{this.props.children} </div>
        }
      }

      class Child extends React.Component {
        render() {
          return <h1>{this.props.params.name}</h1>
        }
      }

      render((
        <Router history={createHistory('/apple%2Fbanana')}>
          <Route component={Parent}>
            <Route path='/:name' component={Child} />
          </Route>
        </Router>
      ), node, function () {
        expect(node.textContent.trim()).toEqual('apple/banana')
        done()
      })
    })

  })

})

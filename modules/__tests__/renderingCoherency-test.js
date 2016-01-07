import expect from 'expect'
import React, { Component } from 'react'
import { renderToString } from 'react-dom/server'
import { render, unmountComponentAtNode } from 'react-dom'
import match from '../match'
import Route from '../Route'
import Router from '../Router'
import RouterContext from '../RouterContext'
import createHistory from '../createMemoryHistory'

const containerId = 'container'

function stripReactAttributes(node) {
  node.removeAttribute('data-reactid')
  node.removeAttribute('data-react-checksum')
  for (let i = 0; i < node.children.length; i++) {
    stripReactAttributes(node.children[i])
  }
  return node
}

function toDOMNode(htmlString) {
  const parser = new DOMParser()
  return parser.parseFromString(htmlString, 'text/html')
}

function normalizeReactHTMLString(htmlString) {
  const domTree = toDOMNode(htmlString)
  const node = domTree.getElementById(containerId)
  return normalizeReactHTMLNode(node)
}

function normalizeReactHTMLNode(htmlNode) {
  const normalizedNode = stripReactAttributes(htmlNode)
  return normalizedNode
}

describe('server rendering', function () {
  class MainComponent extends Component {
    render() {
      return (
        <div id={containerId}>
          <strong>Foo</strong>
        </div>
      )
    }
  }

  const targetLocation = '/'

  const routes = (
    <Router history={createHistory(targetLocation)}>
      <Route component={MainComponent} path={targetLocation} />
    </Router>
  )

  function synchronousOnEnter() {}

  const routesWithSynchronousOnEnter = (
    <Router history={createHistory(targetLocation)}>
      <Route component={MainComponent} path={targetLocation} onEnter={synchronousOnEnter} />
    </Router>
  )

  function asynchronousOnEnter(nextState, replaceState, callback) {
    setTimeout(callback, 1000)
  }

  const routesWithAsynchronousOnEnter = (
    <Router history={createHistory(targetLocation)}>
      <Route component={MainComponent} path={targetLocation} onEnter={asynchronousOnEnter} />
    </Router>
  )

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  function executeRenderingComparisonTest(routes, callback) {
    match({ routes, location: targetLocation }, function (error, redirectLocation, renderProps) {
      const serverRendered = renderToString(
        <RouterContext {...renderProps} />
      )

      render(routes, node, function () {
        const serverHTML = normalizeReactHTMLString(serverRendered)
        const clientHTML = normalizeReactHTMLNode(node.children[0])
        expect(serverHTML).toEqual(clientHTML)
        callback()
      })
    })
  }

  it('renders the same output on the server and on the client', function (done) {
    executeRenderingComparisonTest(routes, done)
  })

  it('renders the same output on the server and on the client when there is a synchronous onEnter handler', function (done) {
    executeRenderingComparisonTest(routesWithSynchronousOnEnter, done)
  })

  it('renders the same output on the server and on the client when there is an asynchronous onEnter handler', function (done) {
    executeRenderingComparisonTest(routesWithAsynchronousOnEnter, done)
  })
})

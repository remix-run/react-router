import expect from 'expect'
import React, { Component } from 'react'
import { render } from 'react-dom'
import createHistory from '../createMemoryHistory'
import Router from '../Router'
import Route from '../Route'
import routerLink from '../routerLink'

describe('routerLink', function () {

  class _MyLink extends Component {
    render() {
      return (
        <div
          data-linkactive={this.props.linkActive}
          data-linkHref={this.props.linkHref}
        ></div>)
    }
  }

  const MyLink = routerLink(_MyLink)

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  it('knows how to make its hrefs', function () {
    render((
      <Router history={createHistory('/')}>
        <Route path="/" component={() => <MyLink to={{
          pathname: '/hello/michael',
          query: { the: 'query' },
          hash: '#the-hash'
        }} /> } />
      </Router>
    ), node, function () {
      const linkDiv = node.querySelector('div')
      expect(linkDiv.getAttribute('data-linkHref')).toEqual('/hello/michael?the=query#the-hash')
    })
  })

  describe('when the route is "/"', function () {
    it('a link to "/" should be active', function () {
      render((
        <Router history={createHistory('/')}>
          <Route path="/" component={() => <MyLink to="/" />} />
        </Router>
      ), node, function () {
        const linkDiv = node.querySelector('div')
        expect(linkDiv.getAttribute('data-linkactive')).toEqual('true')
      })
    })
    it('a link to "/hello" should not be active', function () {
      render((
        <Router history={createHistory('/')}>
          <Route path="/" component={() => <MyLink to="/hello" />} />
        </Router>
      ), node, function () {
        const linkDiv = node.querySelector('div')
        expect(linkDiv.getAttribute('data-linkactive')).toEqual('false')
      })
    })
  })


})

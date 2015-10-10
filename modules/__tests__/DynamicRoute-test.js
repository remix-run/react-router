/*eslint-env mocha */
import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import IndexLink from '../IndexLink'
import Router from '../Router'
import Link from '../Link'

describe('Dynamic Routes', function () {

  class App extends Component {
    render() {
      return (
        <div>
          <ul>
            <li><IndexLink id="overviewLink" to="/website" activeClassName="active">overview</IndexLink></li>
            <li><Link id="checkoutLink" to="/website/checkout" activeClassName="active">checkout</Link></li>
            <li><Link id="contactLink" to="/website/contact" activeClassName="active">contact</Link></li>
          </ul>
          {this.props.children}
        </div>
      )
    }
  }

  class Website extends Component {
    render() {
      return <div>website wrapper {this.props.children}</div>
    }
  }

  class CheckoutPage extends Component {
    render() {
      return <div>checkout page</div>
    }
  }

  class ContactPage extends Component {
    render() {
      return <div>contact page</div>
    }
  }

  class IndexPage extends Component {
    render() {
      return <div>index page</div>
    }
  }

  const routes = {
    childRoutes: [ {
      path: '/',
      component: App,
      childRoutes: [
        {
          path: 'website',
          component: Website,
          childRoutes: [
            { path: 'checkout', component: CheckoutPage },
            { path: 'contact', component: ContactPage }
          ],
          getIndexRoute(location, callback) {
            setTimeout(function () {
              callback(null, { component: IndexPage } )
            })
          }
        }
      ]
    } ]
  }

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    unmountComponentAtNode(node)
  })

  describe('when linking to an index link', function () {
    it('is active and non-index routes are not', function (done) {
      render((
        <Router history={createHistory('/website')} routes={routes} />
      ), node, function () {
        expect(node.querySelector('#overviewLink').className).toEqual('active')
        expect(node.querySelector('#checkoutLink').className).toEqual('')
        expect(node.querySelector('#contactLink').className).toEqual('')
        done()
      })
    })
  })

})

/*eslint-env mocha */
/*eslint react/prop-types: 0*/
import expect from 'expect'
import React from 'react'
import createHistory from 'history/lib/createMemoryHistory'
import IndexRoute from '../IndexRoute'
import Router from '../Router'
import Route from '../Route'
import IndexLink from '../IndexLink'
import Link from '../Link'

describe('An <IndexLink>', function () {

  const App = React.createClass({
    render() {
      return (
        <div>
          <ul>
            <li><IndexLink id="overviewLink" to="/website" activeClassName="active">overview</IndexLink></li>
            <li><Link id="contactLink" to="/website/contact" activeClassName="active">contact</Link></li>
            <li><IndexLink id="productsLink" to="/website/products" activeClassName="active">products</IndexLink></li>
            <li><Link id="specificProductLink" to="/website/products/15" activeClassName="active">specific product</Link></li>
          </ul>
          {this.props.children}
        </div>
      )
    }
  })

  const Website = React.createClass({
    render() {
      return <div>website wrapper {this.props.children}</div>
    }
  })

  const WebsiteOverview = React.createClass({
    render() {
      return <div>website overview </div>
    }
  })

  const WebsiteContact = React.createClass({
    render() {
      return <div>contact page </div>
    }
  })

  const WebsiteProducts = React.createClass({
    render() {
      return <div>website products {this.props.children}</div>
    }
  })

  const WebsiteProductsProduct = React.createClass({
    render() {
      return <div>specific product {this.props.params.productId} </div>
    }
  })

  const WebsiteProductsIndex = React.createClass({
    render() {
      return <div>list of produts </div>
    }
  })

  const routes = (
    <Route component={App}>
        <Route path="/website" component={Website}>
            <Route path="products" component={WebsiteProducts}>
                <Route path=":productId" component={WebsiteProductsProduct} />
                <IndexRoute component={WebsiteProductsIndex} />
            </Route>
            <Route path="contact" component={WebsiteContact} />
            <IndexRoute component={WebsiteOverview} />
        </Route>
    </Route>    
  )

  let node
  beforeEach(function () {
    node = document.createElement('div')
  })

  afterEach(function () {
    React.unmountComponentAtNode(node)
  })

  describe('when linking to the overview', function () {
    it("is active and other routes are not", function (done) {
      React.render((
        <Router history={createHistory('/website')} routes={routes} />
      ), node, function () {
        expect(node.querySelector('#overviewLink').className).toEqual('active')
        expect(node.querySelector('#contactLink').className).toEqual('')
        expect(node.querySelector('#productsLink').className).toEqual('')
        expect(node.querySelector('#specificProductLink').className).toEqual('')
        done()
      })
    })
  })

  describe('when linking to the contact', function () {
    it("is active and other routes are not", function (done) {
      React.render((
        <Router history={createHistory('/website/contact')} routes={routes} />
      ), node, function () {
        expect(node.querySelector('#overviewLink').className).toEqual('')
        expect(node.querySelector('#contactLink').className).toEqual('active')
        expect(node.querySelector('#productsLink').className).toEqual('')
        expect(node.querySelector('#specificProductLink').className).toEqual('')
        done()
      })
    })
  })

  describe('when linking to the products', function () {
    it("is active and other routes are not", function (done) {
      React.render((
        <Router history={createHistory('/website/products')} routes={routes} />
      ), node, function () {
        expect(node.querySelector('#overviewLink').className).toEqual('')
        expect(node.querySelector('#contactLink').className).toEqual('')
        expect(node.querySelector('#productsLink').className).toEqual('active')
        expect(node.querySelector('#specificProductLink').className).toEqual('')
        done()
      })
    })
  })

  describe('when linking to a specific product', function () {
    it("is active and it parent is also active", function (done) {
      React.render((
        <Router history={createHistory('/website/products/15')} routes={routes} />
      ), node, function () {
        expect(node.querySelector('#overviewLink').className).toEqual('')
        expect(node.querySelector('#contactLink').className).toEqual('')
        expect(node.querySelector('#productsLink').className).toEqual('active')
        expect(node.querySelector('#specificProductLink').className).toEqual('active')
        done()
      })
    })
  })

})

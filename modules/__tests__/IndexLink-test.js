import expect from 'expect'
import React, { Component } from 'react'
import { render, cleanup } from '@testing-library/react'
import createHistory from '../createMemoryHistory'
import IndexRoute from '../IndexRoute'
import IndexLink from '../IndexLink'
import Router from '../Router'
import Route from '../Route'
import Link from '../Link'

describe('An <IndexLink>', function () {

  class App extends Component {
    render() {
      return (
        <div>
          <ul>
            <li><IndexLink id="rootLink" to="/" activeClassName="active">root</IndexLink></li>
            <li><IndexLink id="overviewLink" to="/website" activeClassName="active">overview</IndexLink></li>
            <li><Link id="contactLink" to="/website/contact" activeClassName="active">contact</Link></li>
            <li><Link id="productsLink" to="/website/products" activeClassName="active">products</Link></li>
            <li><IndexLink id="productsIndexLink" to="/website/products" activeClassName="active">products index</IndexLink></li>
            <li><Link id="specificProductLink" to="/website/products/15" activeClassName="active">specific product</Link></li>
          </ul>
          {this.props.children}
        </div>
      )
    }
  }

  class RootWrapper extends Component {
    render() {
      return <div>root wrapper {this.props.children}</div>
    }
  }

  class RootPage extends Component {
    render() {
      return <div>website root</div>
    }
  }

  class Wrapper extends Component {
    render() {
      return <div>website wrapper {this.props.children}</div>
    }
  }

  class IndexPage extends Component {
    render() {
      return <div>website overview</div>
    }
  }

  class ContactPage extends Component {
    render() {
      return <div>contact page</div>
    }
  }

  class ProductsPage extends Component {
    render() {
      return <div>website products {this.props.children}</div>
    }
  }

  class ProductPage extends Component {
    render() {
      return <div>specific product {this.props.params.productId}</div>
    }
  }

  class ProductsIndexPage extends Component {
    render() {
      return <div>list of products</div>
    }
  }

  const routes = (
    <Route component={App}>
      <Route path="/" component={RootWrapper}>
        <IndexRoute component={RootPage} />
        <Route path="website" component={Wrapper}>
          <Route path="products" component={ProductsPage}>
            <Route path=":productId" component={ProductPage} />
            <IndexRoute component={ProductsIndexPage} />
          </Route>
          <Route path="contact" component={ContactPage} />
          <IndexRoute component={IndexPage} />
        </Route>
      </Route>
    </Route>
  )

  afterEach(function () {
    cleanup()
  })

  describe('when linking to the root', function () {
    it('is active and other routes are not', function () {
      render((
        <Router history={createHistory('/')} routes={routes} />
      ))
      expect(document.querySelector('#rootLink').className).toEqual('active')
      expect(document.querySelector('#overviewLink').className).toEqual('')
      expect(document.querySelector('#contactLink').className).toEqual('')
      expect(document.querySelector('#productsLink').className).toEqual('')
      expect(document.querySelector('#productsIndexLink').className).toEqual('')
      expect(document.querySelector('#specificProductLink').className).toEqual('')
    })
  })

  describe('when linking to the overview', function () {
    it('is active and other routes are not', function () {
      render((
        <Router history={createHistory('/website')} routes={routes} />
      ))
      expect(document.querySelector('#rootLink').className).toEqual('')
      expect(document.querySelector('#overviewLink').className).toEqual('active')
      expect(document.querySelector('#contactLink').className).toEqual('')
      expect(document.querySelector('#productsLink').className).toEqual('')
      expect(document.querySelector('#productsIndexLink').className).toEqual('')
      expect(document.querySelector('#specificProductLink').className).toEqual('')
    })
  })

  describe('when linking to the contact', function () {
    it('is active and other routes are not', function () {
      render((
        <Router history={createHistory('/website/contact')} routes={routes} />
      ))
      expect(document.querySelector('#rootLink').className).toEqual('')
      expect(document.querySelector('#overviewLink').className).toEqual('')
      expect(document.querySelector('#contactLink').className).toEqual('active')
      expect(document.querySelector('#productsLink').className).toEqual('')
      expect(document.querySelector('#productsIndexLink').className).toEqual('')
      expect(document.querySelector('#specificProductLink').className).toEqual('')
    })
  })

  describe('when linking to the products', function () {
    it('is active and other routes are not', function () {
      render((
        <Router history={createHistory('/website/products')} routes={routes} />
      ))
      expect(document.querySelector('#rootLink').className).toEqual('')
      expect(document.querySelector('#overviewLink').className).toEqual('')
      expect(document.querySelector('#contactLink').className).toEqual('')
      expect(document.querySelector('#productsLink').className).toEqual('active')
      expect(document.querySelector('#productsIndexLink').className).toEqual('active')
      expect(document.querySelector('#specificProductLink').className).toEqual('')
    })
  })

  describe('when linking to a specific product', function () {
    it("is active and it's parent is also active", function () {
      render((
        <Router history={createHistory('/website/products/15')} routes={routes} />
      ))
      expect(document.querySelector('#rootLink').className).toEqual('')
      expect(document.querySelector('#overviewLink').className).toEqual('')
      expect(document.querySelector('#contactLink').className).toEqual('')
      expect(document.querySelector('#productsLink').className).toEqual('active')
      expect(document.querySelector('#productsIndexLink').className).toEqual('')
      expect(document.querySelector('#specificProductLink').className).toEqual('active')
    })
  })

})

/*eslint-env mocha */
import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import IndexLink from '../IndexLink'
import execSteps from './execSteps'
import Router from '../Router'
import Link from '../Link'

describe('Dynamic Routes', function () {

  class App extends Component {
    render() {
      return (
        <div>
          <ul>
            <li><IndexLink id="overviewLink" to="/website" activeClassName="active">overview</IndexLink></li>
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
      let overviewLink, contactLink
      const steps = [
        function () {
          overviewLink = node.querySelector('#overviewLink')
          contactLink = node.querySelector('#contactLink')
          expect(overviewLink.className).toEqual('')
          expect(contactLink.className).toEqual('active')
          this.history.pushState(null, '/website')
        },
        function () {
          expect(overviewLink.className).toEqual('active')
          expect(contactLink.className).toEqual('')
        }
      ]

      const execNextStep = execSteps(steps, done)

      render((
        <Router onUpdate={execNextStep} history={createHistory('/website/contact')} routes={routes} />
      ), node, execNextStep)
    })
  })

})

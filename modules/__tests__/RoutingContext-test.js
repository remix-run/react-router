import expect from 'expect'
import React, { Component } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import createHistory from 'history/lib/createMemoryHistory'
import Router from '../Router'
import Route from '../Route'
import RoutingContext from '../RoutingContext'

describe('RoutingContext', function () {
  let node
  beforeEach(() => node = document.createElement('div'))
  afterEach(() => unmountComponentAtNode(node))

  it('applies custom RoutingContext', function (done) {
    const Parent = ({ children }) => <span>parent:{children}</span>
    const Child = () => <span>child</span>

    class LabelWrapper extends Component {
      constructor(props, context) {
        super(props, context)
        this.createElement = this.createElement.bind(this)
      }

      createElement(component, props) {
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

    LabelWrapper.defaultProps = {
      createElement: React.createElement
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

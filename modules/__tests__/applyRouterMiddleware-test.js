import expect from 'expect'
import React, { cloneElement } from 'react'
import createReactClass from 'create-react-class'
import PropTypes from 'prop-types'
import { render } from 'react-dom'
import Router from '../Router'
import Route from '../Route'
import createMemoryHistory from '../createMemoryHistory'
import applyMiddleware from '../applyRouterMiddleware'
import shouldWarn from './shouldWarn'

const FOO_ROOT_CONTAINER_TEXT = 'FOO ROOT CONTAINER'
const BAR_ROOT_CONTAINER_TEXT = 'BAR ROOT CONTAINER'
const BAZ_CONTAINER_TEXT = 'BAZ INJECTED'

const FooRootContainer = createReactClass({
  propTypes: { children: PropTypes.node.isRequired },
  childContextTypes: { foo: PropTypes.string },
  getChildContext() { return { foo: FOO_ROOT_CONTAINER_TEXT } },
  render() {
    return this.props.children
  }
})

const FooContainer = createReactClass({
  propTypes: { children: PropTypes.node.isRequired },
  contextTypes: { foo: PropTypes.string.isRequired },
  render() {
    const { children, ...props } = this.props
    const fooFromContext = this.context.foo
    return cloneElement(children, { ...props, fooFromContext })
  }
})

const useFoo = () => ({
  renderRouterContext: (child) => (
    <FooRootContainer>{child}</FooRootContainer>
  ),
  renderRouteComponent: (child) => (
    <FooContainer>{child}</FooContainer>
  )
})

const BarRootContainer = createReactClass({
  propTypes: { children: PropTypes.node.isRequired },
  childContextTypes: { bar: PropTypes.string },
  getChildContext() { return { bar: BAR_ROOT_CONTAINER_TEXT } },
  render() {
    return this.props.children
  }
})

const BarContainer = createReactClass({
  propTypes: { children: PropTypes.node.isRequired },
  contextTypes: { bar: PropTypes.string.isRequired },
  render() {
    const { children, ...props } = this.props
    const barFromContext = this.context.bar
    return cloneElement(children, { ...props, barFromContext })
  }
})

const useBar = () => ({
  renderRouterContext: (child) => (
    <BarRootContainer>{child}</BarRootContainer>
  ),
  renderRouteComponent: (child) => (
    <BarContainer>{child}</BarContainer>
  )
})

const useBaz = (bazInjected) => ({
  renderRouteComponent: (child) => (
    cloneElement(child, { bazInjected })
  )
})

const run = ({ renderWithMiddleware, Component }, assertion) => {
  const div = document.createElement('div')
  const routes = <Route path="/" component={Component}/>
  render(<Router
    render={renderWithMiddleware}
    routes={routes}
    history={createMemoryHistory('/')}
  />, div, () => assertion(div.innerHTML))
}

describe('applyMiddleware', () => {

  it('applies one middleware', (done) => {
    run({
      renderWithMiddleware: applyMiddleware(useFoo()),
      Component: (props) => <div>{props.fooFromContext}</div>
    }, (html) => {
      expect(html).toContain(FOO_ROOT_CONTAINER_TEXT)
      done()
    })
  })

  it('applies more than one middleware', (done) => {
    run({
      renderWithMiddleware: applyMiddleware(useBar(), useFoo()),
      Component: (props) => <div>{props.fooFromContext} {props.barFromContext}</div>
    }, (html) => {
      expect(html).toContain(FOO_ROOT_CONTAINER_TEXT)
      expect(html).toContain(BAR_ROOT_CONTAINER_TEXT)
      done()
    })
  })

  it('applies more middleware with only `getContainer`', (done) => {
    run({
      renderWithMiddleware: applyMiddleware(
        useBar(),
        useFoo(),
        useBaz(BAZ_CONTAINER_TEXT)
      ),
      Component: (props) => (
        <div>
          {props.fooFromContext}
          {props.barFromContext}
          {props.bazInjected}
        </div>
      )
    }, (html) => {
      expect(html).toContain(FOO_ROOT_CONTAINER_TEXT)
      expect(html).toContain(BAR_ROOT_CONTAINER_TEXT)
      expect(html).toContain(BAZ_CONTAINER_TEXT)
      done()
    })
  })

  it('applies middleware that only has `getContainer`', (done) => {
    run({
      renderWithMiddleware: applyMiddleware(
        useBaz(BAZ_CONTAINER_TEXT)
      ),
      Component: (props) => (
        <div>{props.bazInjected}</div>
      )
    }, (html) => {
      expect(html).toContain(BAZ_CONTAINER_TEXT)
      done()
    })
  })

  it('should warn on invalid middleware', () => {
    shouldWarn('at index 0 does not appear to be a valid')
    shouldWarn('at index 2 does not appear to be a valid')

    applyMiddleware(
      {},
      { renderRouterContext: () => {} },
      {}
    )
  })
})

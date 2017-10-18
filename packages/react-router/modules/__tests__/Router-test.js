import React from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import Router from '../Router'
import createHistory from 'history/createMemoryHistory'

describe('A <Router>', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  describe('when it has more than one child', () => {
    it('throws an error explaining a Router may have only one child', () => {      
      spyOn(console, 'error')
  
      expect(() => {
        ReactDOM.render(
          <Router history={createHistory()}>
            <p>Foo</p>
            <p>Bar</p>
          </Router>,
          node
        )
      }).toThrow(/A <Router> may have only one child element/)
    })
  })

  describe('with exactly one child', () => {
    it('does not throw an error', () => {
      expect(() => {
        ReactDOM.render(
          <Router history={createHistory()}>
            <p>Bar</p>
          </Router>,
          node
        )
      }).not.toThrow()
    })
  })

  describe('with no children', () => {
    it('does not throw an error', () => {
      expect(() => {
        ReactDOM.render(
          <Router history={createHistory()} />,
          node
        )
      }).not.toThrow()
    })
  })

  describe('context', () => {
    let rootContext
    const ContextChecker = (props, context) => {
      rootContext = context
      return null
    }

    ContextChecker.contextTypes = {
      router: PropTypes.shape({
        history: PropTypes.object,
        route: PropTypes.object
      })
    }

    afterEach(() => {
      rootContext = undefined
    })

    it('puts history on context.history', () => {
      const history = createHistory()
      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )

      expect(rootContext.router.history).toBe(history)
    })

    it('sets context.router.route at the root', () => {
      const history = createHistory({
        initialEntries: ['/']
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker/>
        </Router>,
        node
      )

      expect(rootContext.router.route.match.path).toEqual('/')
      expect(rootContext.router.route.match.url).toEqual('/')
      expect(rootContext.router.route.match.params).toEqual({})
      expect(rootContext.router.route.match.isExact).toEqual(true)
      expect(rootContext.router.route.location).toEqual(history.location)
    })

    it('updates context.router.route upon navigation', () => {
      const history = createHistory({
        initialEntries: [ '/' ]
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )

      expect(rootContext.router.route.match.isExact).toBe(true)

      const newLocation = { pathname: '/new' }
      history.push(newLocation)

      expect(rootContext.router.route.match.isExact).toBe(false)
    })

    it('does not contain context.router.staticContext by default', () => {
      const history = createHistory({
        initialEntries: [ '/' ]
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )

      expect(rootContext.router.staticContext).toBe(undefined)
    })
  })
})

import expect from 'expect'
import React from 'react'
import Router from '../Router'
import ReactDOM from 'react-dom'
import createHistory from 'history/createMemoryHistory'

describe('A <Router>', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  describe('when it has more than one child', () => {
    it('throws an error explaining a Router may have only one child', () => {
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
      }).toNotThrow()
    })
  })

  describe('with no children', () => {
    it('does not throw an error', () => {
      expect(() => {
        ReactDOM.render(
          <Router history={createHistory()} />,
          node
        )
      }).toNotThrow()
    })
  })

  describe('context', () => {
    let rootContext
    const ContextChecker = (props, context) => {
      rootContext = context
      return null
    }

    ContextChecker.contextTypes = {
      history: React.PropTypes.object,
      react_router_route: React.PropTypes.object
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

      expect(rootContext.history).toBe(history)
    })

    it('sets context.react_router_route at the root', () => {
      const history = createHistory({
        initialEntries: ['/']
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker/>
        </Router>,
        node
      )

      expect(rootContext.react_router_route.match.path).toEqual('/')
      expect(rootContext.react_router_route.match.url).toEqual('/')
      expect(rootContext.react_router_route.match.params).toEqual({})
      expect(rootContext.react_router_route.match.isExact).toEqual(true)
      expect(rootContext.react_router_route.location).toEqual(history.location)
    })

    it('updates context.react_router_route upon navigation', () => {
      const history = createHistory({
        initialEntries: [ '/' ]
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )

      expect(rootContext.react_router_route.match.isExact).toBe(true)

      const newLocation = { pathname: '/new' }
      history.push(newLocation)

      expect(rootContext.react_router_route.match.isExact).toBe(false)
    })
  })
})

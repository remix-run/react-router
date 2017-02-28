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
      route: React.PropTypes.object
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

    it('sets context.route at the root', () => {
      const history = createHistory({
        initialEntries: ['/']
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker/>
        </Router>,
        node
      )

      expect(rootContext.route).toEqual({
        path: '/',
        url: '/',
        params: {},
        isExact: true
      })
    })

    it('updates context.route upon navigation', () => {
      const history = createHistory({
        initialEntries: [ '/' ]
      })

      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )

      expect(rootContext.route.isExact).toBe(true)

      const newLocation = { pathname: '/new' }
      history.push(newLocation)

      expect(rootContext.route.isExact).toBe(false)
    })
  })
})

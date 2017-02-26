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
    it('throws an error explaining a Router can only have one child', () => {
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

  describe('context.router', () => {
    let rootContext
    const ContextChecker = (props, context) => {
      rootContext = context.router
      return null
    }
    ContextChecker.contextTypes = { router: React.PropTypes.object }

    afterEach(() => {
      rootContext = undefined
    })

    it('sets a root match', () => {
      const history = createHistory({ initialEntries: ['/'] })
      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )
      expect(rootContext.match).toEqual({
        path: '/',
        url: '/',
        params: {},
        isExact: true
      })
    })

    it('spreads the history object\'s properties', () => {
      const history = createHistory()
      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )

      Object.keys(history).forEach(key => {
        expect(rootContext[key]).toEqual(history[key])
      })
    })

    it('updates history properties upon navigation', () => {
      const history = createHistory()
      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )
      expect(rootContext.length).toBe(1)

      const newLocation = { pathname: '/new' }
      history.push(newLocation)

      Object.keys(newLocation).forEach(key => {
        expect(rootContext.location[key]).toEqual(newLocation[key])
      })
      expect(rootContext.action).toBe('PUSH')
      expect(rootContext.length).toBe(2)
    })

    it('updates match.isExact upon navigation', () => {
      const history = createHistory({ initialEntries: ['/'] })
      ReactDOM.render(
        <Router history={history}>
          <ContextChecker />
        </Router>,
        node
      )
      expect(rootContext.match.isExact).toBe(true)

      const newLocation = { pathname: '/new' }
      history.push(newLocation)

      expect(rootContext.match.isExact).toBe(false)
    })
  })
})

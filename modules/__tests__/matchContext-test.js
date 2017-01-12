import expect, { createSpy, spyOn } from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Route from '../Route'
import matchProvider from '../matchProvider'
import withMatch from '../withMatch'
import MemoryRouter from '../MemoryRouter'


const RouteInRouter = ({ match, component, ...props }) => (
  <MemoryRouter>
    <Route match={match} component={component} {...props} />
  </MemoryRouter>
)

describe('match higher-order components', () => {
  const div = document.createElement('div')

  afterEach(() => {
    unmountComponentAtNode(div)
  })

  describe('matchProvider', () => {
    it('makes match available through the context', () => {
      const match = { path: '/foo' }

      const ContextChecker = (props, context) => {
        const localMatch = context.match.getMatch()
        expect(localMatch.path).toEqual(match.path)
        return null
      }
      ContextChecker.contextTypes = {
        match: React.PropTypes.object
      }

      const Parent = matchProvider(() => <ContextChecker />)

      render(<RouteInRouter match={match} component={Parent} />, div)
    })

    it('renders the component, passing it all of its props', () => {
      const match = { path: '/foo' }
      
      const Parent = matchProvider((props) => {
        expect(props).toIncludeKeys(['match', 'history'])
        return null
      })

      render(<RouteInRouter match={match} component={Parent} />, div)
    })

    it('provides a listen function to listen for prop changes', () => {
      const match = { path: '/foo' }

      const ContextChecker = (props, context) => {
        expect(context.match.listen).toExist()
        return null
      }
      ContextChecker.contextTypes = {
        match: React.PropTypes.object
      }

      const Parent = matchProvider(() => <ContextChecker />)
      render(<RouteInRouter match={match} component={Parent} />, div)
    })

    it('calls all listeners when it receives new props', () => {
      const match = { path: '/foo' }
      const updateSpy = createSpy()

      const Parent = matchProvider(() => <ContextChecker />)

      class ContextChecker extends React.Component {

        static contextTypes = {
          match: React.PropTypes.object
        }

        componentWillMount() {
          this.context.match.listen(updateSpy)
        }

        render() {
          return null
        }
      }
      render(<RouteInRouter match={match} component={Parent} />, div, () => {
        expect(updateSpy.calls.length).toEqual(0)
        match.path = '/bar'
        render(<RouteInRouter match={match} component={Parent} />, div)
        expect(updateSpy.calls.length).toEqual(1)
      })
    })
  })

  describe('withMatch', () => {
    it('injects context.match as a prop', () => {
      const match = { path: '/foo' }

      const ContextChecker = withMatch((props) => {
        expect(props.match.path).toEqual(match.path)
        return null
      })

      const Parent = matchProvider(() => <ContextChecker />)

      render(<RouteInRouter match={match} component={Parent} />, div)
    })

    it('subscribes to match changes to avoid sCU blocks', () => {
      const match = { path: '/foo' }

      const MatchBlocker = matchProvider(class extends React.Component {
        shouldComponentUpdate() {
          return false
        }

        render() {
          return <ContextChecker />
        }
      })

      const ContextChecker = withMatch((props) => {
        expect(props.match.path).toEqual(match.path)
        return null
      })

      render(<RouteInRouter match={{ path: '/foo' }} component={MatchBlocker} />, div, () => {
        match.path = '/bar'
        render(<RouteInRouter match={{ path: '/bar' }} component={MatchBlocker} />, div)
      })
    })

    it('unsubscribes when unmounting', () => {
      const match = { path: '/foo' }

      const ContextChecker = withMatch((props) => null)

      let renderChildren = true
      const Parent = matchProvider(() => (
        renderChildren ? <ContextChecker /> : false
      ))
      const unlistenSpy = spyOn(Parent.prototype, 'unlisten').andCallThrough()

      render(<RouteInRouter match={match} component={Parent} />, div, () => {
        expect(unlistenSpy.calls.length).toBe(0)

        renderChildren = false
        render(<RouteInRouter match={match} component={Parent} />, div)

        expect(unlistenSpy.calls.length).toBe(1)
      })
    })
  })
})

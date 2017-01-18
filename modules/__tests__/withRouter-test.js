import expect, { createSpy, spyOn } from 'expect'
import React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
import Route from '../Route'
import withRouter from '../withRouter'
import Router from '../Router'
import createMemoryHistory from 'history/createMemoryHistory'

describe('withRouter', () => {
  const div = document.createElement('div')

  afterEach(() => {
    unmountComponentAtNode(div)
  })

  it('injects match and history props', () => {
    const PATH = '/foo'
    const history = createMemoryHistory({
      initialEntries: [PATH]
    })

    const ContextChecker = withRouter((props) => {
      expect(props.history).toBe(history)
      expect(props.parentMatch.path).toEqual(PATH)
      return null
    })

    const Parent = () => <ContextChecker />
    render((
      <Router history={history}>
        <Route path={PATH} component={Parent} />
      </Router>
    ), div)
  })

  it('avoids sCU blocks', () => {
    const PATH = '/foo'
    const firstPath = PATH
    const secondPath = PATH + '/bar'
    const MatchBlocker = class extends React.Component {
      shouldComponentUpdate() {
        return false
      }

      render() {
        return <ContextChecker />
      }
    }
    let currentPath
    let currentMatch
    const ContextChecker = withRouter((props) => {
      currentPath = props.history.location.pathname
      currentMatch = props.parentMatch
      return null
    })

    const history = createMemoryHistory({
      initialEntries: [firstPath, secondPath]
    })
    render((
      <Router history={history}>
        <Route path={PATH} component={MatchBlocker} />
      </Router>
    ), div)
    expect(currentPath).toBe(firstPath)
    expect(currentMatch.isExact).toBe(true)

    history.goForward()
    expect(currentPath).toBe(secondPath)
    expect(currentMatch.isExact).toBe(false)
  })
})

import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import createMemoryHistory from 'history/createMemoryHistory'
import Router from '../Router'
import MemoryRouter from '../MemoryRouter'
import Route from '../Route'
import withRouter from '../withRouter'

describe('withRouter', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  it('injects a "router" prop', () => {
    const ContextChecker = withRouter(props => {
      expect(props.router).toBeAn('object')
      return null
    })

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bubblegum' ]}>
        <Route path="/bubblegum" component={ContextChecker}/>
      </MemoryRouter>
    ), node)
  })

  it('circumvents sCU blocks', () => {
    class UpdateBlocker extends React.Component {
      shouldComponentUpdate() {
        return false
      }
      render() {
        return <ContextChecker/>
      }
    }

    let router
    const ContextChecker = withRouter(props => {
      router = props.router
      return null
    })

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bubblegum', '/shoelaces' ]}>
        <Route component={UpdateBlocker}/>
      </MemoryRouter>
    ), node)

    expect(router.location.pathname).toBe('/bubblegum')

    router.goForward()

    expect(router.location.pathname).toBe('/shoelaces')
  })
})

import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import Route from '../Route'
import withRouter from '../withRouter'

describe('withRouter', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  it('injects a "location" prop', () => {
    const ContextChecker = withRouter(props => {
      expect(props.location).toBeAn('object')
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

    let location, goForward
    const ContextChecker = withRouter(props => {
      location = props.location
      goForward = props.goForward
      return null
    })

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bubblegum', '/shoelaces' ]}>
        <Route component={UpdateBlocker}/>
      </MemoryRouter>
    ), node)

    expect(location.pathname).toBe('/bubblegum')

    goForward()

    expect(location.pathname).toBe('/shoelaces')
  })
})

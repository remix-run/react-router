import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import StaticRouter from '../StaticRouter'
import Route from '../Route'
import withRouter from '../withRouter'

describe('withRouter', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  it('provides { match, location, history } props', () => {
    const PropsChecker = withRouter(props => {
      expect(props.match).toBeAn('object')
      expect(props.location).toBeAn('object')
      expect(props.history).toBeAn('object')
      return null
    })

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bubblegum' ]}>
        <Route path="/bubblegum" render={() => (
          <PropsChecker/>
        )}/>
      </MemoryRouter>
    ), node)
  })

  it('provides the parent match as a prop to the wrapped component', () => {
    let parentMatch
    const PropsChecker = withRouter(props => {
      expect(props.match).toEqual(parentMatch)
      return null
    })

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bubblegum' ]}>
        <Route path="/:flavor" render={({ match }) => {
          parentMatch = match
          return <PropsChecker/>
        }}/>
      </MemoryRouter>
    ), node)
  })

  describe('inside a <StaticRouter>', () => {
    it('provides the staticContext prop', () => {
      const PropsChecker = withRouter(props => {
        expect(props.staticContext).toBeAn('object')
        expect(props.staticContext).toBe(context)
        return null
      })

      const context = {}

      ReactDOM.render((
        <StaticRouter context={context}>
          <Route component={PropsChecker}/>
        </StaticRouter>
      ), node)
    })
  })
})

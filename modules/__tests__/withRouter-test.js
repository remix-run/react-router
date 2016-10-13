import expect from 'expect'
import React from 'react'
import { render } from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import withRouter from '../withRouter'
import Redirect from '../Redirect'

describe('withRouter', () => {
  const App = ({ location, Component }) => (
    <MemoryRouter initialEntries={[location]} initialIndex={0}>
      <Component />
    </MemoryRouter>
  )

  it('passes history, router, and location as props', (done) => {
    const div = document.createElement('div')
    const location = { pathname: '/url-1' }

    const component = (props) => {
      expect(props.history).toNotBe(undefined)
      expect(props.router).toNotBe(undefined)
      expect(props.location).toNotBe(undefined)

      expect(props.location).toInclude({ pathname: '/url-1' })
      expect(props.history).toExcludeKey('location')
      return <div />
    }

    render(
      <App location={location} Component={withRouter(component)} />,
      div,
      () => done()
    )
  })

  it('re-renders and passes down new props when location changes', (done) => {
    const div = document.createElement('div')
    const location = { pathname: '/url-1' }
    let redirected = false

    const component = (props) => {
      if (redirected) {
        expect(props.location.pathname).toBe('/url-2')
        redirected = true
        return <Redirect to='/url-2' />
      } else {
        expect(props.location.pathname).toBe('/url-1')
        return null
      }
    }

    render(
      <App location={location} Component={withRouter(component)} />,
      div,
      () => done()
    )
  })
})

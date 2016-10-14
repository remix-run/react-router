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

  let div, location

  beforeEach(() => {
    div = document.createElement('div')
  })

  it('passes history, router, and location as props', (done) => {
    location = { pathname: '/url-1' }

    const Component = (props) => {
      expect(props.history).toNotBe(undefined)
      expect(props.router).toNotBe(undefined)
      expect(props.location).toNotBe(undefined)

      expect(props.location).toInclude({ pathname: '/url-1' })
      expect(props.history).toExcludeKey('location')
      return <div />
    }

    render(
      <App location={location} Component={withRouter(Component)} />,
      div,
      () => done()
    )
  })

  it('re-renders and passes down new props when location changes', (done) => {
    location = { pathname: '/url-1' }
    let redirected = false

    const Component = (props) => {
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
      <App location={location} Component={withRouter(Component)} />,
      div,
      () => done()
    )
  })

  it('can be used with or without options', () => {
    const Component = () => <div />
    const withOptions = withRouter({})(Component)
    const withoutOptions = withRouter(Component)
    expect(typeof withOptions).toBe('function')
    expect(typeof withoutOptions).toBe('function')
  })

  it('hoists statics', () => {
    class Component extends React.Component {
      static Test = 'test'
      render() { return null }
    }

    expect(withRouter(Component).Test).toBe('test')
  })

  it('exposes a displayName property', () => {
    class MyComponent extends React.Component {
      static displayName = 'MyComponent'
      render() { return null }
    }
    expect(withRouter(MyComponent).displayName).toBe('withRouter(MyComponent)')
  })

  it('exposes a WrappedComponent property', () => {
    class MyComponent extends React.Component {
      render() { return null }
    }
    expect(withRouter(MyComponent).WrappedComponent).toBe(MyComponent)
  })

  it('can expose a wrappedInstance property on the instance', (done) => {
    class MyComponent extends React.Component {
      render() { return null }
    }
    const EnhancedComponent = withRouter({ withRef: true })(MyComponent)

    class App extends React.Component {
      checkRef(ref) {
        expect(ref.wrappedInstance instanceof MyComponent).toBe(true)
      }
      render() {
        return <EnhancedComponent ref={e => this.checkRef(e)} />
      }
    }

    render(<App />, div, () => done())
  })
})

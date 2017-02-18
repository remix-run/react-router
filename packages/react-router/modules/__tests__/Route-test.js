import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import Route from '../Route'

describe('A <Route>', () => {
  it('renders at the root', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('does not render when it does not match', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bunnies' ]}>
        <Route path="/flowers" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain(TEXT)
  })

  it('renders when it does not match but `always` is specified', () => {
    const node = document.createElement('div')

    let TEXT = 'bubblegum always render'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bunnies' ]}>
        <Route path="/flowers" always render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)

    TEXT = 'bubblegum always component'
    const Text = () => <h1>{TEXT}</h1>
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bunnies' ]}>
        <Route path="/flowers" always component={Text}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('component prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    const Home = () => <div>{TEXT}</div>
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" component={Home} />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('props prop', () => {
    const props = {TEXT: 'Mrs. Kato component'}
    const node = document.createElement('div')
    const Home = ({TEXT}) => <div>{TEXT}</div>
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" component={Home} props={props}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(props.TEXT)

    props.TEXT = 'Mrs. Kato render'
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={({TEXT}) => <h1>{TEXT}</h1>} props={props}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(props.TEXT)
  })

  describe('props prop overrides routing props', () => {
    const TEXT = 'The library'
    const props = {location: TEXT}
    const node = document.createElement('div')
    const Home = ({location}) => <div>{location}</div>
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" component={Home} props={props}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('render prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => <div>{TEXT}</div>} />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('children function prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" children={() => <div>{TEXT}</div>} />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('children element prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/">
          <div>{TEXT}</div>
        </Route>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('supports preact by nulling out children prop when empty array is passed', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <h1>{TEXT}</h1>
        )}>
          {[]}
        </Route>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })
})

describe('A <Route exact>', () => {
  it('renders when the URL does not have a trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath/' ]}>
        <Route exact path="/somepath" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('renders when the URL has trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath' ]}>
        <Route exact path="/somepath/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })
})

describe('A <Route exact strict>', () => {
  it('does not render when the URL has a trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath/' ]}>
        <Route exact strict path="/somepath" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain(TEXT)
  })

  it('does not render when the URL does not have a trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath' ]}>
        <Route exact strict path="/somepath/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain(TEXT)
  })
})

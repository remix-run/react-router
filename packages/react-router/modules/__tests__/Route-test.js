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

  describe('relative paths', () => {
    it('resolves using the parent match', () => {      
      const initialEntries = ['/', '/recipes', '/recipes/pizza']
      const TEXT = 'TEXT'
      const node = document.createElement('div')
      ReactDOM.render((
        <MemoryRouter initialEntries={initialEntries} initialIndex={2}>
          <Route path='/recipes' render={() => (
            <Route path='pizza' render={() => <div>{TEXT}</div>} />
          )} />
        </MemoryRouter>
      ), node)
      expect(node.textContent).toContain(TEXT)
    })

    it('works when match is null', () => {
      const initialEntries = ['/', '/recipes']
      const TEXT = 'TEXT'
      const node = document.createElement('div')
      ReactDOM.render((
        <MemoryRouter initialEntries={initialEntries} initialIndex={1}>
          <Route path='recipes' render={() => <div>{TEXT}</div>} />
        </MemoryRouter>
      ), node)
      expect(node.textContent).toContain(TEXT)
    })

    it('works when path is empty string', () => {
      const initialEntries = ['/hello']
      const TEXT = 'TEXT'
      const node = document.createElement('div')
      ReactDOM.render((
        <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
          <Route path='hello' render={() => (
            <Route path='' render={() => <div>{TEXT}</div>} />
          )} />
        </MemoryRouter>
      ), node)
      expect(node.textContent).toContain(TEXT)
    })

    it('works with pathless routes', () => {
      const initialEntries = ['/', '/pizza']
      const TEXT = 'TEXT'
      const node = document.createElement('div')
      ReactDOM.render((
        <MemoryRouter initialEntries={initialEntries} initialIndex={1}>
          <Route render={() => (
            <Route path='pizza' render={() => <div>{TEXT}</div>} />
          )} />
        </MemoryRouter>
      ), node)
      expect(node.textContent).toContain(TEXT)
    })
  })
})

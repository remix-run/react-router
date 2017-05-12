import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import { Simulate } from 'react-addons-test-utils'
import MemoryRouter from 'react-router/MemoryRouter'
import HashRouter from '../HashRouter'
import Link from '../Link'
import Route from 'react-router/Route'
import Switch from 'react-router/Switch'

describe('A <Link>', () => {
  it('accepts a location "to" prop', () => {
    const location = {
      pathname: '/the/path',
      search: 'the=query',
      hash: '#the-hash'
    }
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter>
        <Link to={location}>link</Link>
      </MemoryRouter>
    ), node)

    const href = node.querySelector('a').getAttribute('href')

    expect(href).toEqual('/the/path?the=query#the-hash')
  })
})

describe('When a <Link> is clicked', () => {
  it('calls its onClick handler')

  it('changes the location')

  describe('and the onClick handler calls event.preventDefault()', () => {
    it('does not change the location')
  })
})

describe('A <Link> underneath a <HashRouter>', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  const createLinkNode = (hashType, to) => {
    ReactDOM.render((
      <HashRouter hashType={hashType}>
        <Link to={to}/>
      </HashRouter>
    ), node)

    return node.querySelector('a')
  }

  describe('with the "slash" hashType', () => {
    it('has the correct href', () => {
      const linkNode = createLinkNode('slash', '/foo')
      expect(linkNode.getAttribute('href')).toEqual('#/foo')
    })

    it('has the correct href with a leading slash if it is missing', () => {
      const linkNode = createLinkNode('slash', 'foo')
      expect(linkNode.getAttribute('href')).toEqual('#/foo')
    })
  })

  describe('with the "hashbang" hashType', () => {
    it('has the correct href', () => {
      const linkNode = createLinkNode('hashbang', '/foo')
      expect(linkNode.getAttribute('href')).toEqual('#!/foo')
    })

    it('has the correct href with a leading slash if it is missing', () => {
      const linkNode = createLinkNode('hashbang', 'foo')
      expect(linkNode.getAttribute('href')).toEqual('#!/foo')
    })
  })

  describe('with the "noslash" hashType', () => {
    it('has the correct href', () => {
      const linkNode = createLinkNode('noslash', 'foo')
      expect(linkNode.getAttribute('href')).toEqual('#foo')
    })

    it('has the correct href and removes the leading slash', () => {
      const linkNode = createLinkNode('noslash', '/foo')
      expect(linkNode.getAttribute('href')).toEqual('#foo')
    })
  })
})

describe('A relative <Link>', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  it('resolves using the parent match', () => {
    const initialEntries = ['/', '/recipes']
    ReactDOM.render((
      <MemoryRouter initialEntries={initialEntries} initialIndex={1}>
        <Route path='/recipes' render={() => (
          <Link to='tacos'>Chess</Link>
        )} />
      </MemoryRouter>
    ), node)
    const a = node.getElementsByTagName('a')[0]
    expect(a.pathname).toBe('/recipes/tacos')
  })

  it('works when not in a route', () => {
    const initialEntries = ['/']
    ReactDOM.render((
      <MemoryRouter initialEntries={initialEntries} initialIndex={0}>
        <Link to='recipes'>Recipes</Link>
      </MemoryRouter>
    ), node)
    const a = node.getElementsByTagName('a')[0]
    expect(a.pathname).toBe('/recipes')
  })

  it('navigates correctly', () => {
    const initialEntries = ['/', '/recipes']
    const RESTAURANTS = 'RESTAURANTS'
    ReactDOM.render((
      <MemoryRouter initialEntries={initialEntries} initialIndex={1}>
        <Switch>
          <Route path='/recipes' render={() => (
            <Link to='../restaurants'>Order Takeout</Link>
          )} />
          <Route path='/restaurants' render={() => (
            <div>{RESTAURANTS}</div>
          )} />
        </Switch>
      </MemoryRouter>
    ), node)
    expect(node.textContent).toNotContain(RESTAURANTS)
    const a = node.getElementsByTagName('a')[0]
    Simulate.click(a, {
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true },
      metaKey: null,
      altKey: null,
      ctrlKey: null,
      shiftKey: null,
      button: 0
    })
    expect(node.textContent).toContain(RESTAURANTS)
  })
})

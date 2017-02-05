import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from 'react-router/MemoryRouter'
import HashRouter from '../HashRouter'
import BrowserRouter from '../BrowserRouter'
import Link from '../Link'
import { Simulate } from 'react-addons-test-utils'

describe('A <Link>', () => {
  it('accepts a location "to" prop', () => {
    const location = {
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash'
    }
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter>
        <Link to={location}>link</Link>
      </MemoryRouter>
    ), node)

    const href = node.querySelector('a').getAttribute('href')
    const { pathname, search, hash } = location

    expect(href).toEqual(pathname + search + hash)
  })
})

describe('When a <Link> is clicked', () => {
  const node = document.createElement('div')

  let locationInd = 0
  const generateNextLocation = () => (
    {
      pathname: '/the/path' + ++locationInd,
      search: '?the=query' + locationInd,
      hash: '#the-hash' + locationInd,
      state: { locationInd }
    }
  )

  const extractCurrentLocation = () => {
    const { pathname, search, hash } = window.location
    const { state } = window.history.state
    return { pathname, search, hash, state }
  }

  const createLinkAndClick = ({to = generateNextLocation(), ...props} = {}) => {
    ReactDOM.render((
      <BrowserRouter>
        <Link to={to} {...props}>link</Link>
      </BrowserRouter>
    ), node)

    const link = node.querySelector('a')
    Simulate.click(link, {button: 0})
  }

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  it('calls its onClick handler', () => {
		let clicked = false
		const onClick = () => clicked = true

    createLinkAndClick({onClick})

		expect(clicked).toEqual(true)
	})

  it('changes the location', () => {
    const location = generateNextLocation()
    expect(extractCurrentLocation()).toNotEqual(location)

    createLinkAndClick({to: location})

    expect(extractCurrentLocation()).toEqual(location)
  })

  it('pushes to history', () => {
    const historyLength = window.history.length
    createLinkAndClick()

    expect(window.history.length).toEqual(historyLength + 1)
  })

  describe('and the onClick handler calls event.preventDefault()', () => {
    const onClick = (e) => e.preventDefault()

    it('does not change the location', () => {
      const currentLocation = extractCurrentLocation()
      createLinkAndClick({onClick})

      expect(extractCurrentLocation()).toEqual(currentLocation)
    })

    it('does not push to history', () => {
      const historyLength = window.history.length
      createLinkAndClick({onClick})

      expect(window.history.length).toEqual(historyLength)
    })
  })

  describe('and has a truthy "replace" property', () => {
    it('does not push to history', () => {
      const historyLength = window.history.length
      createLinkAndClick({replace: true})

      expect(window.history.length).toEqual(historyLength)
    })
  })

	describe('and it leads to the same (current) location', () => {
    it('does not push to history', () => {
      const historyLength = window.history.length
      const currentLocation = extractCurrentLocation()
      createLinkAndClick({to: currentLocation})

      expect(window.history.length).toEqual(historyLength)
    })
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

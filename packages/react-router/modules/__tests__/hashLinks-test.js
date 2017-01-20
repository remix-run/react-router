import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import HashRouter from '../HashRouter'
import Link from '../Link'

describe('A <Link> underneath a <HashRouter>', () => {
  const div = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(div)
  })

  const createLinkNode = (hashType, to) => {
    ReactDOM.render((
      <HashRouter hashType={hashType}>
        <Link to={to}/>
      </HashRouter>
    ), div)

    return div.querySelector('a')
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

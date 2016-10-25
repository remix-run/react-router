import expect from 'expect'
import { render, unmountComponentAtNode } from 'react-dom'
import React from 'react'
import HashRouter from '../HashRouter'
import Link from '../Link'

describe('HashRouter', () => {
  const div = document.createElement('div')

  afterEach(() => {
    unmountComponentAtNode(div)
  })

  const linkCreator = (hashType, to) => {
    render((
      <HashRouter hashType={hashType}>
        <Link to={to} />
      </HashRouter>
    ), div)
    const a = div.querySelector('a')
    return a
  }

  describe('hashType slash', () => {
    it('adds a hash link', () => {
      const link = linkCreator('slash', '/foo')
      expect(link.getAttribute('href')).toEqual('#/foo')
    })

    it('adds a hash link with a leading slash if it is missing', () => {
      const link = linkCreator('slash', 'foo')
      expect(link.getAttribute('href')).toEqual('#/foo')
    })
  })

  describe('hashType hashbang', () => {
    it('adds a hashbang to the link', () => {
      const link = linkCreator('hashbang', '/foo')
      expect(link.getAttribute('href')).toEqual('#!/foo')
    })

    it('adds a hashbang to the link with a leading slash if it is missing', () => {
      const link = linkCreator('hashbang', 'foo')
      expect(link.getAttribute('href')).toEqual('#!/foo')
    })
  })

  describe('hashType noslash', () => {
    it('adds a hash link', () => {
      const link = linkCreator('noslash', 'foo')
      expect(link.getAttribute('href')).toEqual('#foo')
    })

    it('adds a hash link and removes the leading slash', () => {
      const link = linkCreator('noslash', '/foo')
      expect(link.getAttribute('href')).toEqual('#foo')
    })
  })
})

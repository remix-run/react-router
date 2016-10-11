import expect from 'expect'
import { render } from 'react-dom'
import React from 'react'
import HashRouter from '../HashRouter'
import Link from '../Link'

describe('HashRouter', () => {
  describe('empty hashType', () => {
    it('adds a hash to the link', () => {
      const div = document.createElement('div')
      render((
        <HashRouter>
          <Link to="/foo" />
        </HashRouter>
      ), div)
      const a = div.querySelector('a')
      expect(a.getAttribute('href')).toEqual('#/foo')
    })
  })

  describe('hashType hashbang', () => {
    it('adds a hashbang to the link', () => {
      const div = document.createElement('div')
      render((
        <HashRouter hashType="hashbang">
          <Link to="/foo" />
        </HashRouter>
      ), div)
      const a = div.querySelector('a')
      expect(a.getAttribute('href')).toEqual('#!/foo')
    })
  })
})

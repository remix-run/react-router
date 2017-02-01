import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from 'react-router/MemoryRouter'
import NavLink from '../NavLink'

describe('NavLink', () => {
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  describe('When a <NavLink> is active', () => {
    it('applies its activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza' activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
    })

    it('applies its activeStyle', () => {
      const defaultStyle = { color: 'black' }
      const activeStyle = { color: 'red' }

      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            style={defaultStyle}
            activeStyle={activeStyle}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.style.color).toBe(activeStyle.color)
    })
  })

  describe('When a <NavLink> is not active', () => {
    it('does not apply its activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad' activeClassName='active'>Salad?</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })

    it('does not apply its activeStyle', () => {
      const defaultStyle = { color: 'black' }
      const activeStyle = { color: 'red' }

      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/salad'
            style={defaultStyle}
            activeStyle={activeStyle}
            >
            Salad?
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.style.color).toBe(defaultStyle.color)
    })
  })
  
  describe('isActive', () => {
    const activeExact = (match, location) => !!match && match.isExact

    it('applies active props when isActive returns true', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName='active'
            isActive={activeExact}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toContain('active')
    })

    it('does not apply active props when isActive returns false', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza/anchovies'
            activeClassName='active'
            isActive={activeExact}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toNotContain('active')
    })
  })

})

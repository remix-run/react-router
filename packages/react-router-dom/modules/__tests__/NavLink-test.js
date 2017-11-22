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
    it('applies its default activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('applies its passed activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza' activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).toEqual('selected')
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

    it('applies aria-current of true if no override value is given', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza' activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.getAttribute('aria-current')).toEqual('true')
    })

    it('applies the override aria-current value when given', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pizza'
                   activeClassName='selected'
                   aria-current="page">Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.getAttribute('aria-current')).toEqual('page')
    })
        
    it('it properly escapes path-to-regexp special characters', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza (1)']}>
          <NavLink to='/pizza (1)'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)

      const href = node.querySelector('a').getAttribute('href')
      expect(href).toEqual('/pizza (1)')
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })
  })

  describe('When a <NavLink> is not active', () => {
    it('does not apply its default activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad'>Salad?</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
    })

    it('does not apply its passed activeClassName', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad' activeClassName='selected'>Salad?</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).not.toContain('selected')
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

    it('does not apply an aria-current value if no override value is given', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad'
                   activeClassName='selected'
                   aria-current="page">Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.getAttribute('aria-current')).toBeNull()
    })

    it('does not apply an aria-current value if an override value is given', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/salad' activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.getAttribute('aria-current')).toBeNull()
    })
  })

  describe('isActive', () => {
    it('applies active default props when isActive returns true', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            isActive={() => true}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('applies active passed props when isActive returns true', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName="selected"
            isActive={() => true}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).toEqual('selected')
    })

    it('does not apply active default props when isActive returns false', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            isActive={() => false}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
    })

    it('does not apply active passed props when isActive returns false', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink
            to='/pizza'
            activeClassName="selected"
            isActive={() => false}
            >
            Pizza!
          </NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).not.toContain('selected')
    })
  })

  describe('exact', () => {
    it('does not do exact matching by default', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink to='/pizza' activeClassName='active'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('sets active default value only for exact matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink exact to='/pizza'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('sets active passed value only for exact matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink exact to='/pizza' activeClassName="selected">Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).toEqual('selected')
    })

    it('does not set active default value for partial matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink exact to='/pizza'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
    })

    it('does not set active passed value for partial matches', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/anchovies']}>
          <NavLink exact to='/pizza' activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).not.toContain('selected')
    })
  })

  describe('strict (enforce path\'s trailing slash)', () => {
    const PATH = '/pizza/'
    it('does not do strict matching by default', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to={PATH}>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('does not set active default value when location.pathname has no trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink strict to={PATH}>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
    })

    it('does not set active passed value when location.pathname has no trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink strict to={PATH} activeClassName='selected'>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).not.toContain('selected')
    })

    it('sets active default value when pathname has trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/']}>
          <NavLink strict to={PATH}>Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).toEqual('active')
    })

    it('sets active passed value when pathname has trailing slash', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza/']}>
          <NavLink strict to={PATH} activeClassName="selected">Pizza!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).toEqual('selected')
    })
  })

  describe('location property', () => {
    it('overrides the current location', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pizza']}>
          <NavLink to='/pasta' activeClassName='selected' location={{pathname: '/pasta'}}>Pasta!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).toContain('selected')
    })

    it('is not overwritten by the current location', () => {
      ReactDOM.render((
        <MemoryRouter initialEntries={['/pasta']}>
          <NavLink to='/pasta' activeClassName='selected' location={{pathname: '/pizza'}}>Pasta!</NavLink>
        </MemoryRouter>
      ), node)
      const a = node.getElementsByTagName('a')[0]
      expect(a.className).not.toContain('active')
      expect(a.className).not.toContain('selected')
    })
  })
})

import expect from 'expect'
import createBrowserHistory from '../createBrowserHistory'
import createHashHistory from '../createHashHistory'
import createMemoryHistory from '../createMemoryHistory'

describe('a browser history', () => {
  describe('with no basename', () => {
    let history
    beforeEach(() => {
      history = createBrowserHistory()
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('/the/path?the=query#the-hash')
    })
  })

  describe('with a basename', () => {
    let history
    beforeEach(() => {
      history = createBrowserHistory({ basename: '/the/base' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('/the/base/the/path?the=query#the-hash')
    })
  })

  describe('with a bad basename', () => {
    let history
    beforeEach(() => {
      history = createBrowserHistory({ basename: '/the/bad/base/' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('/the/bad/base/the/path?the=query#the-hash')
    })
  })

  describe('with a slash basename', () => {
    let history
    beforeEach(() => {
      history = createBrowserHistory({ basename: '/' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('/the/path?the=query#the-hash')
    })
  })

  describe('with a unicode location', () => {
    let history
    beforeEach(() => {
      history = createBrowserHistory({ basename: '/' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/歴史',
        search: '?キー=値',
        hash: '#ハッシュ'
      })

      const pathname = '/%E6%AD%B4%E5%8F%B2'
      const search = '?%E3%82%AD%E3%83%BC=%E5%80%A4'
      const hash = '#%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5'
      expect(href).toEqual(pathname + search + hash)
    })
  })
})

describe('a hash history', () => {
  describe('with default encoding', () => {
    let history
    beforeEach(() => {
      history = createHashHistory()
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('#/the/path?the=query#the-hash')
    })
  })

  describe('with hashType="noslash"', () => {
    let history
    beforeEach(() => {
      history = createHashHistory({ hashType: 'noslash' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('#the/path?the=query#the-hash')
    })
  })

  describe('with hashType="hashbang"', () => {
    let history
    beforeEach(() => {
      history = createHashHistory({ hashType: 'hashbang' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query',
        hash: '#the-hash'
      })

      expect(href).toEqual('#!/the/path?the=query#the-hash')
    })
  })

  describe('with a basename', () => {
    let history
    beforeEach(() => {
      history = createHashHistory({ basename: '/the/base' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query'
      })

      expect(href).toEqual('#/the/base/the/path?the=query')
    })
  })

  describe('with a bad basename', () => {
    let history
    beforeEach(() => {
      history = createHashHistory({ basename: '/the/bad/base/' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query'
      })

      expect(href).toEqual('#/the/bad/base/the/path?the=query')
    })
  })

  describe('with a slash basename', () => {
    let history
    beforeEach(() => {
      history = createHashHistory({ basename: '/' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/the/path',
        search: '?the=query'
      })

      expect(href).toEqual('#/the/path?the=query')
    })
  })

  describe('with a unicode location', () => {
    let history
    beforeEach(() => {
      history = createHashHistory({ basename: '/' })
    })

    it('knows how to create hrefs', () => {
      const href = history.createHref({
        pathname: '/歴史',
        search: '?キー=値'
      })

      const pathname = '#/%E6%AD%B4%E5%8F%B2'
      const search = '?%E3%82%AD%E3%83%BC=%E5%80%A4'
      expect(href).toEqual(pathname + search)
    })
  })
})

describe('a memory history', () => {
  let history
  beforeEach(() => {
    history = createMemoryHistory()
  })

  it('knows how to create hrefs', () => {
    const href = history.createHref({
      pathname: '/the/path',
      search: '?the=query',
      hash: '#the-hash'
    })

    expect(href).toEqual('/the/path?the=query#the-hash')
  })

  describe('with a unicode location', () => {
    it('encodes unicode pathnames', () => {
      const href = history.createHref({
        pathname: '/歴史',
        search: '?キー=値',
        hash: '#ハッシュ'
      })

      const pathname = '/%E6%AD%B4%E5%8F%B2'
      const search = '?%E3%82%AD%E3%83%BC=%E5%80%A4'
      const hash = '#%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5'
      expect(href).toEqual(pathname + search + hash)
    })
  })
})

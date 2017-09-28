import generatePath from '../generatePath'

describe('generatePath', () => {
  describe('with pattern="/"', () => {
    it('returns correct url with no params', () => {
      const pattern = '/'
      const generated = generatePath(pattern)
      expect(generated).toBe('/')
    })

    it('returns correct url with params', () => {
      const pattern = '/'
      const params = { foo: "tobi", bar: 123 }
      const generated = generatePath(pattern, params)
      expect(generated).toBe('/')
    })
  })

  describe('with pattern="/:foo/somewhere/:bar"', () => {
    it('throws with no params', () => {
      const pattern = '/:foo/somewhere/:bar'
      expect(() => {
        generatePath(pattern)
      }).toThrow()
    })

    it('throws with some params', () => {
      const pattern = '/:foo/somewhere/:bar'
      const params = { foo: "tobi", quux: 999 }
      expect(() => {
        generatePath(pattern, params)
      }).toThrow()
    })

    it('returns correct url with params', () => {
      const pattern = '/:foo/somewhere/:bar'
      const params = { foo: "tobi", bar: 123 }
      const generated = generatePath(pattern, params)
      expect(generated).toBe('/tobi/somewhere/123')
    })

    it('returns correct url with additional params', () => {
      const pattern = '/:foo/somewhere/:bar'
      const params = { foo: "tobi", bar: 123, quux: 999 }
      const generated = generatePath(pattern, params)
      expect(generated).toBe('/tobi/somewhere/123')
    })
  })

  describe('with no path', () => {
    it('matches the root URL', () => {
      const generated = generatePath()
      expect(generated).toBe('/')
    })
  })
})

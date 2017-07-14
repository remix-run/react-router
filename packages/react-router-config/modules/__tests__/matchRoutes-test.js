import matchRoutes from '../matchRoutes'
import expect from 'expect'

it('finds matched routes', () => {
  const routes = [
    { path: '/',
      exact: true
    },

    { path: '/pepper',
      routes: [
        { path: '/pepper/:type',
          routes: [
            { path: '/pepper/:type/scoville' }
          ]
        }
      ]
    },

    { path: undefined,
      routes: [
        { path: '/ghost' }
      ]
    }
  ]

  const branch = matchRoutes(routes, '/pepper/jalepeno')
  expect(branch.length).toEqual(2)
  expect(branch[0].route).toEqual(routes[1])
  expect(branch[1].route).toEqual(routes[1].routes[0])
})

it('stops matching after finding the first match, just like <Switch>', () => {
  const routes = [
    { path: '/static' },
    { path: '/:dynamic' }
  ]
  const branch = matchRoutes(routes, '/static')
  expect(branch.length).toEqual(1)
  expect(branch[0].route).toEqual(routes[0])
})


describe('pathless routes', () => {

  const routes = [
    { path: '/',
      routes: [
        { path: undefined,
          routes: [
            { path: '/habenero' }
          ]
        }
      ]
    }
  ]

  it('matches child paths', () => {
    const branch = matchRoutes(routes, '/habenero')
    expect(branch.length).toEqual(3)
    expect(branch[0].route).toEqual(routes[0])
    expect(branch[1].route).toEqual(routes[0].routes[0])
    expect(branch[2].route).toEqual(routes[0].routes[0].routes[0])
  })

  it('returns the parent match', () => {
    const branch = matchRoutes(routes, '/habenero')
    expect(branch.length).toBe(3)
    expect(branch[1].match).toBe(branch[0].match)
  })

  describe('at the root', () => {
    const routes = [
      { path: undefined,
        routes: [
          { path: '/anaheim' }
        ]
      }
    ]

    it('matches "/"', () => {
      const branch = matchRoutes(routes, '/')
      expect(branch.length).toEqual(1)
      expect(branch[0].route).toEqual(routes[0])
    })

    it('returns a root match for a pathless root route', () => {
      const branch = matchRoutes(routes, '/')
      expect(branch[0].match).toEqual({
        path: '/',
        url: '/',
        params: {},
        isExact: true
      })
    })
  })
})

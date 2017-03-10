import matchRoutes from '../matchRoutes'
import renderRoutes from '../renderRoutes'
import expect from 'expect'
import { renderToString } from 'react-dom/server'
import React from 'react'
import StaticRouter from 'react-router/StaticRouter'

describe('integration', () => {
  it('generates the same matches in renderRoutes and matchRoutes', () => {
    const rendered = []

    const Comp = ({ match, route: { routes } }) => (
      rendered.push(match),
      renderRoutes(routes)
    )

    const routes = [
      { path: '/pepper',
        component: Comp,
        routes: [
          { path: '/pepper/:type',
            component: Comp,
            routes: [
              { path: '/pepper/:type/scoville',
                component: Comp
              }
            ]
          }
        ]
      },

      { path: undefined,
        component: Comp,
        routes: [
          { path: '/ghost',
            component: Comp
          }
        ]
      }
    ]

    const pathname = '/pepper/jalepeno'
    const branch = matchRoutes(routes, pathname)
    renderToString(
      <StaticRouter location={pathname} context={{}}>
        {renderRoutes(routes)}
      </StaticRouter>
    )
    expect(branch.length).toEqual(2)
    expect(rendered.length).toEqual(2)
    expect(branch[0].match).toEqual(rendered[0])
    expect(branch[1].match).toEqual(rendered[1])
  })



  it('generates the same matches in renderRoutes and matchRoutes with pathless routes', () => {
    const rendered = []

    const Comp = ({ match, route: { routes } }) => (
      rendered.push(match),
      renderRoutes(routes)
    )

    const routes = [
      { path: '/pepper',
        component: Comp,
        routes: [
          { path: '/pepper/:type',
            component: Comp,
            routes: [
              { path: '/pepper/:type/scoville',
                component: Comp
              }
            ]
          }
        ]
      },

      { path: undefined,
        component: Comp,
        routes: [
          { path: '/ghost',
            component: Comp
          }
        ]
      }
    ]

    const pathname = '/ghost'
    const branch = matchRoutes(routes, pathname)
    renderToString(
      <StaticRouter location={pathname} context={{}}>
        {renderRoutes(routes)}
      </StaticRouter>
    )
    expect(branch.length).toEqual(2)
    expect(rendered.length).toEqual(2)
    expect(branch[0].match).toEqual(rendered[0])
    expect(branch[1].match).toEqual(rendered[1])
  })
})


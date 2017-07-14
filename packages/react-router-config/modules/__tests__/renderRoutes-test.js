import React from 'react'
import ReactDOMServer from 'react-dom/server'
import StaticRouter from 'react-router/StaticRouter'
import renderRoutes from '../renderRoutes'

describe('renderRoutes', () => {
  let rendered
  const Comp = ({ route, route: { routes } }) => (
    rendered.push(route),
    renderRoutes(routes)
  )

  beforeEach(() => {
    rendered = []
  })

  it('renders pathless routes', () => {
    const routeToMatch = {
      component: Comp
    }
    const routes = [routeToMatch]

    ReactDOMServer.renderToString(
      <StaticRouter location='/path' context={{}}>
        {renderRoutes(routes)}
      </StaticRouter>
    )
    expect(rendered.length).toEqual(1)
    expect(rendered[0]).toEqual(routeToMatch)
  })

  describe('Switch usage', () => {
    it('renders the first matched route', () => {
      const routeToMatch = {
        component: Comp,
        path: '/'
      }
      const routes = [routeToMatch, {
        component: Comp
      }]

      ReactDOMServer.renderToString(
        <StaticRouter location='/' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(1)
      expect(rendered[0]).toEqual(routeToMatch)
    })

    it('renders the first matched route in nested routes', () => {
      const childRouteToMatch = {
        component: Comp,
        path: '/'
      }
      const routeToMatch = {
        component: Comp,
        path: '/',
        routes: [childRouteToMatch, {
          component: Comp
        }]
      }
      const routes = [routeToMatch, {
        component: Comp
      }]

      ReactDOMServer.renderToString(
        <StaticRouter location='/' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(2)
      expect(rendered[0]).toEqual(routeToMatch)
      expect(rendered[1]).toEqual(childRouteToMatch)
    })
  })

  describe('routes with exact', () => {
    it('renders the exact route', () => {
      const routeToMatch = {
        component: Comp,
        path: '/path/child',
        exact: true,
        routes: [{
          component: Comp
        }]
      }
      const routes = [{
        component: Comp,
        path: '/path',
        exact: true
      }, routeToMatch]

      ReactDOMServer.renderToString(
        <StaticRouter location='/path/child' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(2)
      expect(rendered[0]).toEqual(routeToMatch)
      expect(rendered[1]).toEqual({ component: Comp })
    })

    it('skips exact route and does not render it and any of its child routes', () => {
      const routes = [{
        component: Comp,
        path: '/path',
        exact: true,
        routes: [{
          component: Comp
        }, {
          component: Comp
        }]
      }]

      ReactDOMServer.renderToString(
        <StaticRouter location='/path/child' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      ReactDOMServer.renderToString(
        <StaticRouter location='/' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(0)
    })

    it('renders the matched exact route but not its child routes if they do not match', () => {
      const routes = [{
        // should render
        component: Comp,
        path: '/path',
        exact: true,
        routes: [{
          // should skip
          component: Comp,
          path: '/path/child',
          exact: true
        }, {
          // should render
          component: Comp
        }]
      }]

      ReactDOMServer.renderToString(
        <StaticRouter location='/path/child/grandchild' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      ReactDOMServer.renderToString(
        <StaticRouter location='/path' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(2)
      expect(rendered[0]).toEqual(routes[0])
      expect(rendered[1]).toEqual(routes[0].routes[1])
    })
  })

  describe('routes with exact + strict', () => {
    it('renders the exact strict route', () => {
      const routeToMatch = {
        component: Comp,
        path: '/path/',
        exact: true,
        strict: true
      }
      const routes = [{
        // should skip
        component: Comp,
        path: '/path',
        exact: true,
        strict: true
        // should render
      }, routeToMatch]

      ReactDOMServer.renderToString(
        <StaticRouter location='/path/' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(1)
      expect(rendered[0]).toEqual(routeToMatch)
    })

    it('skips exact strict route and does not render it and any of its child routes', () => {
      const routes = [{
        component: Comp,
        path: '/path/',
        exact: true,
        strict: true,
        routes: [{
          component: Comp
        }, {
          component: Comp
        }]
      }]

      ReactDOMServer.renderToString(
        <StaticRouter location='/path/child' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      ReactDOMServer.renderToString(
        <StaticRouter location='/' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      ReactDOMServer.renderToString(
        <StaticRouter location='/path' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(0)
    })

    it('renders the matched exact strict route but not its child routes if they do not match', () => {
      const routes = [{
        // should skip
        component: Comp,
        path: '/path',
        exact: true,
        strict: true
      }, {
        // should render
        component: Comp,
        path: '/path/',
        exact: true,
        strict: true,
        routes: [{
          // should skip
          component: Comp,
          exact: true,
          strict: true,
          path: '/path'
        }, {
          // should render
          component: Comp,
          exact: true,
          strict: true,
          path: '/path/'
        }]
      }]

      ReactDOMServer.renderToString(
        <StaticRouter location='/path/child/grandchild' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      ReactDOMServer.renderToString(
        <StaticRouter location='/path/' context={{}}>
          {renderRoutes(routes)}
        </StaticRouter>
      )
      expect(rendered.length).toEqual(2)
      expect(rendered[0]).toEqual(routes[1])
      expect(rendered[1]).toEqual(routes[1].routes[1])
    })
  })
})

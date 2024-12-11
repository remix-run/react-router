import { RouteComponent } from '..'
import RouterContext from './RouterContext'

export interface Middleware {
  renderRouterContext?(previous: RouterContext, props: any): RouterContext;
  renderRouteComponent?(previous: RouteComponent, props: any): RouteComponent;
}

export default function applyRouterMiddleware(
  ...middlewares: Middleware[]
): (renderProps: any) => RouterContext

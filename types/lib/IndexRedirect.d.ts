import { FunctionComponent, ClassAttributes } from 'react'
import { RoutePattern } from '..'
import { Query } from 'history'

export interface IndexRedirectProps extends ClassAttributes<any> {
  to: RoutePattern;
  query?: Query | undefined;
}

type IndexRedirect = FunctionComponent<IndexRedirectProps>;
declare const IndexRedirect: IndexRedirect

export default IndexRedirect

import { FunctionComponent, ClassAttributes } from 'react'
import { RoutePattern } from '..'
import { IndexRedirectProps } from './IndexRedirect'
import { Query } from 'history'

export interface RedirectProps extends IndexRedirectProps {
  from: RoutePattern;
}

type Redirect = FunctionComponent<RedirectProps>;
declare const Redirect: Redirect

export default Redirect

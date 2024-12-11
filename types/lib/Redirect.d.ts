import { ComponentClass, ClassAttributes } from 'react'
import { RoutePattern } from '..'
import { IndexRedirectProps } from './IndexRedirect'
import { Query } from 'history'

export interface RedirectProps extends IndexRedirectProps {
  from: RoutePattern;
}

type Redirect = ComponentClass<RedirectProps>;
declare const Redirect: Redirect

export default Redirect

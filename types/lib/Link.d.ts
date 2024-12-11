import { ComponentClass, CSSProperties, HTMLProps } from 'react'
import { IndexLinkProps } from './IndexLink'

export interface LinkProps extends IndexLinkProps {
  onlyActiveOnIndex?: boolean | undefined;
}

type Link = ComponentClass<LinkProps>;
declare const Link: Link

export default Link

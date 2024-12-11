import { FunctionComponent, CSSProperties, HTMLProps } from 'react'
import { IndexLinkProps } from './IndexLink'

export interface LinkProps extends IndexLinkProps {
  onlyActiveOnIndex?: boolean | undefined;
}

type Link = FunctionComponent<LinkProps>;
declare const Link: Link

export default Link

import { ComponentClass, CSSProperties, HTMLProps } from 'react'
import { Location, LocationDescriptor } from 'history'

type ToLocationFunction = (location: Location) => LocationDescriptor;

export interface IndexLinkProps extends HTMLProps<any> {
    to: LocationDescriptor | ToLocationFunction;
    activeClassName?: string | undefined;
    activeStyle?: CSSProperties | undefined;
}

type IndexLink = ComponentClass<IndexLinkProps>;
declare const IndexLink: IndexLink

export default IndexLink

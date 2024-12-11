import {
  ComponentClass,
  ClassAttributes,
  ReactNode,
  ComponentType
} from 'react'
import {
  History,
  Href,
  Location,
  LocationDescriptor,
  LocationState,
  Path,
  Pathname,
  Query,
  Search
} from 'history'
import { PlainRoute } from '..'
import React = require('react');

export interface Params {
  [key: string]: string;
}

export type RoutePattern = string;
export type RouteComponent = ComponentType<any>;
export interface RouteComponents {
  [name: string]: RouteComponent;
}
export type RouteConfig = ReactNode | PlainRoute | PlainRoute[];

export type ParseQueryString = (queryString: Search) => Query;
export type StringifyQuery = (queryObject: Query) => Search;

type AnyFunction = (...args: any[]) => any;

export type EnterHook = (
  nextState: RouterState,
  replace: RedirectFunction,
  callback?: AnyFunction
) => any;
export type LeaveHook = (prevState: RouterState) => any;
export type ChangeHook = (
  prevState: RouterState,
  nextState: RouterState,
  replace: RedirectFunction,
  callback?: AnyFunction
) => any;
export type RouteHook = (nextLocation?: Location) => any;

export interface RedirectFunction {
  (location: LocationDescriptor): void;
  (state: LocationState, pathname: Pathname | Path, query?: Query): void;
}

export interface RouterState<Q = any> {
  location: Location<Q>;
  routes: PlainRoute[];
  params: Params;
  components: RouteComponent[];
}

type LocationFunction = (location: LocationDescriptor) => void;
type GoFunction = (n: number) => void;
type NavigateFunction = () => void;
type ActiveFunction = (
  location: LocationDescriptor,
  indexOnly?: boolean
) => boolean;
type LeaveHookFunction = (route: any, callback: RouteHook) => () => void;
type CreatePartFunction<Part> = (
  pathOrLoc: LocationDescriptor,
  query?: any
) => Part;

export interface InjectedRouter {
  push: LocationFunction;
  replace: LocationFunction;
  go: GoFunction;
  goBack: NavigateFunction;
  goForward: NavigateFunction;
  setRouteLeaveHook: LeaveHookFunction;
  createPath: CreatePartFunction<Path>;
  createHref: CreatePartFunction<Href>;
  isActive: ActiveFunction;
}

export interface RouteComponentProps<P, R, ComponentProps = any, Q = any> {
  location: Location<Q>;
  params: P & R;
  route: PlainRoute<ComponentProps>;
  router: InjectedRouter;
  routes: PlainRoute[];
  routeParams: R;
}

export interface RouterProps extends ClassAttributes<any> {
  children?: React.ReactNode;
  routes?: RouteConfig | undefined;
  history?: History | undefined;
  createElement?(component: RouteComponent, props: any): any;
  onError?(error: any): any;
  onUpdate?(): any;
  render?(props: any): ReactNode;
}

type Router = ComponentClass<RouterProps>;
declare const Router: Router

export default Router

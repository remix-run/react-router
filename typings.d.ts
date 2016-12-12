declare module "react-router" {
  export { default as Link } from "react-router/Link";
  export { default as Match } from "react-router/Match";
  export { default as MatchRoutes } from "react-router/MatchRoutes";
  export { default as Miss } from "react-router/Miss";
  export { default as NavigationPrompt } from "react-router/NavigationPrompt";
  export { default as Redirect } from "react-router/Redirect";

  // High-level wrappers
  export { default as BrowserRouter } from "react-router/BrowserRouter";
  export { default as HashRouter } from "react-router/HashRouter";
  export { default as MemoryRouter } from "react-router/MemoryRouter";

  // Low-level wrappers
  export { default as Router } from "react-router/Router";
  export { default as StaticRouter } from "react-router/StaticRouter";
  
}

declare module "react-router/Link" {
  import * as React from "react";

  export interface TransitionTo {
    pathname: string;
  }

  export interface LinkProps {
    to: string;
    replace?: boolean;
    activeStyle?: React.CSSProperties;
    activeClassName?: string;
    activeOnlyWhenExact?: boolean;
    isActive?: (location: Location, to: TransitionTo, props: LinkProps) => boolean;

    // props we have to deal with but aren't necessarily
    // part of the Link API
    style?: React.CSSProperties;
    className?: string;
    target?: string;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  }

  export default class Link extends React.Component<LinkProps, {}> {

  }
}

declare module "react-router/Match" {
  import * as React from "react";

  export interface MatchProps {
    pattern?: string;
    exactly?: boolean;
    component?: Function;
    render?: () => JSX.Element;
  }

  export default class Match extends React.Component<MatchProps, {}> {

  }
}

declare module "react-router/MatchRoutes" {
  import * as React from "react";

  export interface RouteMatch {
    pattern: string;
    exact?: boolean;
    render?: () => JSX.Element;
    component?: Function;
  }

  export interface MatchRoutesProps {
    routes: RouteMatch[];
    renderMiss?: () => JSX.Element;
    missComponent?: Function;
  }

  export default class MatchRoutes extends React.Component<MatchRoutesProps, {}> {

  }
}

declare module "react-router/Miss" {
  import * as React from "react";

  export interface MissProps {
    render?: () => JSX.Element;
    component?: Function;
  }

  export default class Miss extends React.Component<MissProps, {}> {

  }
}

declare module "react-router/NavigationPrompt" {
  import * as React from "react";

  export interface NavigationPromptProps {
    when: boolean;
    message: string | (() => string);
  }

  export default class NavigationPrompt extends React.Component<NavigationPromptProps, {}> {

  }
}

declare module "react-router/Redirect" {
  import * as React from "react";

  export interface RedirectProps {
    to: string | any;
    push?: boolean;
  }

  export default class Redirect extends React.Component<RedirectProps, {}> {

  }
}

declare module "react-router/BrowserRouter" {
  import * as React from "react";

  export interface BrowserRouterProps {
    basename?: string;
    forceRefresh?: boolean;
    getUserConfirmation?: Function;
    keyLength?: number;

    // StaticRouter props
    stringifyQuery?: Function;
    parseQueryString?: Function;
  }

  export default class BrowserRouter extends React.Component<BrowserRouterProps, {}> {

  }
}

declare module "react-router/HashRouter" {
  import * as React from "react";

  export interface HashRouterProps {
    basename?: string;
    getUserConfirmation?: Function;
    hashType?: string;

    // StaticRouter props
    stringifyQuery?: Function;   // TODO should describe better
    parseQueryString?: Function; // TODO should describe better
    createHref: Function;        // TODO should describe better
  }

  export default class HashRouter extends React.Component<HashRouterProps, {}> {

  }
}

declare module "react-router/MemoryRouter" {
  import * as React from "react";

  export interface MemoryRouterProps {
    getUserConfirmation?: Function;
    initialEntries?: any[];       // TODO should describe better
    initialIndex?: number;
    keyLength?: number;

    // StaticRouter props
    stringifyQuery?: Function;   // TODO should describe better
    parseQueryString?: Function; // TODO should describe better
  }

  export default class MemoryRouter extends React.Component<MemoryRouterProps, {}> {

  }
}

declare module "react-router/ServerRouter" {
  import * as React from "react";

  export interface ServerRouterProps {
    basename?: string;
    context: any;                // TODO should describe better
    location: string;
  }

  export default class ServerRouter extends React.Component<ServerRouterProps, {}> {

  }
}

declare module "react-router/Router" {
  import * as React from "react";
  import { History } from "history";

  export interface RouterProps {
    history: History;
  }

  export default class Router extends React.Component<RouterProps, {}> {

  }
}

declare module "react-router/StaticRouter" {
  import * as React from "react";
  import { Location } from "history";

  export interface StaticRouterProps {
    history?: History;
    
    location: string | Location;
    action: string;

    onPush: Function;
    onReplace: Function;
    onMatch?: Function;
    blockTransitions?: Function;

    stringifyQuery?: Function;
    parseQueryString?: Function;
    createHref?: Function;

    basename?: string;
  }

  export default class StaticRouter extends React.Component<StaticRouter, {}> {

  }
}

declare module "react-router/matchPattern" {
  import { Location } from "history";

  export type MatchResult = {
    params: any;
    isExact: boolean;
    pathname: string;
  }

  export default function matchPattern(pattern: string, location: Location, matchExactly: boolean, parent?: Location): MatchResult {

  }
}
